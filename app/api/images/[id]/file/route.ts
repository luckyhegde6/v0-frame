import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { getFileUrl, USE_SUPABASE_STORAGE, BUCKETS, getStorageInfo } from '@/lib/storage'

// Get the correct storage directory
function getStorageDir(): string {
  const info = getStorageInfo()
  return info.baseDir
}

const STORAGE_DIR = getStorageDir()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'thumbnail'
    const size = searchParams.get('size') || '512'

    const session = await auth()
    const isAuthenticated = !!session?.user

    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        album: true,
        collections: true,
        projectImages: {
          include: {
            project: {
              include: {
                shareTokens: true
              }
            }
          }
        }
      }
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const isPubliclyShared = image.projectImages.some(
      pi => pi.project.shareTokens.length > 0
    )

    if (!isPubliclyShared && !isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let contentType = 'image/jpeg'
    let filePath: string

    // If using Supabase, try to get the URL directly
    if (USE_SUPABASE_STORAGE) {
      let bucket: string
      let fileKey: string

      switch (type) {
        case 'thumbnail':
          bucket = BUCKETS.THUMBNAILS
          fileKey = `${imageId}/thumb-${size}.jpg`
          break
        case 'preview':
          bucket = BUCKETS.PROCESSED
          fileKey = `${imageId}/preview.jpg`
          break
        case 'original':
          if (!isAuthenticated) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          }
          // For original, we need to construct the path based on storageType
          if (image.storageType === 'ALBUM' && image.albumId && image.album?.projectId) {
            bucket = BUCKETS.PROJECT_ALBUMS
            const ext = image.mimeType?.split('/')[1] || 'jpg'
            fileKey = `projects/${image.album.projectId}/albums/${image.albumId}/${imageId}.${ext}`
          } else {
            bucket = BUCKETS.USER_GALLERY
            const ext = image.mimeType?.split('/')[1] || 'jpg'
            fileKey = `${image.userId}/Gallery/images/${imageId}.${ext}`
          }
          contentType = image.mimeType || 'image/jpeg'
          break
        default:
          return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
      }

      try {
        const url = await getFileUrl({ bucket: bucket as any, path: fileKey })
        if (url) {
          // Redirect to the Supabase URL
          return NextResponse.redirect(url)
        }
      } catch (error) {
        console.error('[ImageServeAPI] Failed to get Supabase URL:', error)
      }
    }

    // Fallback to local file system
    switch (type) {
      case 'thumbnail':
        filePath = path.join(STORAGE_DIR, 'thumbnails', imageId, `thumb-${size}.jpg`)
        break
      case 'preview':
        filePath = path.join(STORAGE_DIR, 'processed', imageId, 'preview.jpg')
        break
      case 'original':
        filePath = image.tempPath || ''
        contentType = image.mimeType || 'image/jpeg'
        break
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    try {
      await fs.access(filePath)
    } catch {
      // Try fallback paths for unprocessed or missing files
      if (type === 'preview') {
        // Try processed folder with different naming
        const altPreviewPath = path.join(STORAGE_DIR, 'processed', imageId, 'preview.jpg')
        try {
          await fs.access(altPreviewPath)
          filePath = altPreviewPath
        } catch {
          // Try ingest folder as last resort
          const projectTmp = process.env.VERCEL || process.env.NODE_ENV === 'production'
            ? '/tmp'
            : path.resolve(process.cwd(), 'tmp')
          const tempPath = path.join(projectTmp, 'ingest', `${imageId}.jpg`)
          try {
            await fs.access(tempPath)
            filePath = tempPath
          } catch {
            return NextResponse.json({ error: 'Image file not found' }, { status: 404 })
          }
        }
      } else if (type === 'thumbnail') {
        // Try thumbnail folder with different structure
        const projectTmp = process.env.VERCEL || process.env.NODE_ENV === 'production'
          ? '/tmp'
          : path.resolve(process.cwd(), 'tmp')
        const tempPath = path.join(projectTmp, 'ingest', `${imageId}.jpg`)
        try {
          await fs.access(tempPath)
          filePath = tempPath
        } catch {
          return NextResponse.json({ error: 'Image file not found' }, { status: 404 })
        }
      } else {
        return NextResponse.json({ error: 'Image file not found' }, { status: 404 })
      }
    }

    const fileBuffer = await fs.readFile(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })

  } catch (error) {
    console.error('[ImageServeAPI] Failed to serve image:', error)
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 })
  }
}
