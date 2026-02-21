import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'
import path from 'path'
import fs from 'fs/promises'
import archiver from 'archiver'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: albumId } = await params
    const body = await request.json()
    const { imageIds, downloadAll } = body

    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        project: true,
        settings: true,
        images: {
          select: {
            id: true,
            title: true,
            mimeType: true,
            userId: true,
            status: true
          }
        },
        albumImages: {
          include: {
            image: {
              select: {
                id: true,
                title: true,
                mimeType: true,
                userId: true,
                status: true
              }
            }
          }
        }
      }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const isAdmin = session?.user?.role && ['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    
    const bulkDownloadEnabled = album.settings?.bulkDownloadEnabled !== false
    if (!bulkDownloadEnabled && !isAdmin) {
      return NextResponse.json({ error: 'Bulk download is disabled for this album' }, { status: 403 })
    }

    if (album.projectId && !isAdmin) {
      const access = await prisma.clientProjectAccess.findFirst({
        where: {
          projectId: album.projectId,
          userId: session?.user?.id
        }
      })
      
      if (!access) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Collect all images from both direct and junction relationships
    const allImages: { id: string; title: string | null; mimeType: string; userId: string }[] = [
      ...album.images.map(img => ({
        id: img.id,
        title: img.title,
        mimeType: img.mimeType,
        userId: img.userId
      })),
      ...album.albumImages.map(ai => ({
        id: ai.image.id,
        title: ai.image.title,
        mimeType: ai.image.mimeType,
        userId: ai.image.userId
      }))
    ]

    let imagesToDownload = allImages
    if (!downloadAll && imageIds && Array.isArray(imageIds)) {
      imagesToDownload = allImages.filter(img => imageIds.includes(img.id))
    }

    if (imagesToDownload.length === 0) {
      return NextResponse.json({ error: 'No images to download' }, { status: 400 })
    }

    const storageDir = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage')

    // Create zip stream
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []
    
    archive.on('data', (chunk: Buffer) => chunks.push(chunk))

    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => resolve(Buffer.concat(chunks)))
      archive.on('error', reject)
    })

    // Add files to archive
    for (const img of imagesToDownload) {
      const ext = img.mimeType.split('/')[1] || 'jpg'
      let filePath: string
      
      if (album.projectId) {
        filePath = path.join(storageDir, 'projects', album.projectId, 'albums', albumId, `${img.id}.${ext}`)
      } else {
        filePath = path.join(storageDir, 'user', img.userId, 'Gallery', 'images', `${img.id}.${ext}`)
      }

      try {
        await fs.access(filePath)
        const filename = `${img.title || img.id}.${ext}`
        archive.file(filePath, { name: filename })
      } catch {
        console.warn(`File not found: ${filePath}`)
      }
    }

    archive.finalize()
    const zipBuffer = await archivePromise

    // Log the download
    await logAuditEvent({
      action: 'ALBUM_DOWNLOADED',
      entityType: 'Album',
      entityId: albumId,
      userId: session?.user?.id || 'anonymous',
      metadata: {
        albumName: album.name,
        projectId: album.projectId,
        imageCount: imagesToDownload.length,
        downloadAll
      }
    })

    const filename = `${album.name || 'album'}-${downloadAll ? 'all' : 'selected'}.zip`

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': zipBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('[Album Download API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to download album' },
      { status: 500 }
    )
  }
}
