import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'
import path from 'path'
import fs from 'fs/promises'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: imageId } = await params

    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        album: {
          include: {
            project: true,
            settings: true
          }
        }
      }
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const isOwner = image.userId === session?.user?.id
    const isAdmin = session?.user?.role && ['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    
    const downloadEnabled = image.album?.settings?.downloadEnabled !== false
    
    if (!downloadEnabled && !isAdmin) {
      return NextResponse.json({ error: 'Download is disabled for this album' }, { status: 403 })
    }

    if (image.album?.projectId && !isOwner && !isAdmin) {
      const access = await prisma.clientProjectAccess.findFirst({
        where: {
          projectId: image.album.projectId,
          userId: session?.user?.id
        }
      })
      
      if (!access) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const storageDir = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage')
    
    let filePath: string
    if (image.album && image.album.projectId) {
      filePath = path.join(storageDir, 'projects', image.album.projectId, 'albums', image.album.id, `${imageId}.${image.mimeType.split('/')[1] || 'jpg'}`)
    } else {
      filePath = path.join(storageDir, 'user', image.userId, 'Gallery', 'images', `${imageId}.${image.mimeType.split('/')[1] || 'jpg'}`)
    }

    try {
      await fs.access(filePath)
    } catch {
      const tempPath = image.tempPath
      if (tempPath) {
        try {
          await fs.access(tempPath)
          filePath = tempPath
        } catch {
          return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }
      } else {
        return NextResponse.json({ error: 'File not available' }, { status: 404 })
      }
    }

    await logAuditEvent({
      action: 'IMAGE_DOWNLOADED',
      entityType: 'Image',
      entityId: imageId,
      userId: session?.user?.id || 'anonymous',
      metadata: {
        imageName: image.title,
        albumId: image.albumId,
        projectId: image.album?.projectId
      }
    })

    const fileBuffer = await fs.readFile(filePath)
    const ext = image.mimeType.split('/')[1] || 'jpg'
    const filename = `${image.title || 'image'}.${ext}`

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': image.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('[Image Download API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    )
  }
}
