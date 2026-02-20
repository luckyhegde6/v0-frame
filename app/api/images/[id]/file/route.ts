import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

const STORAGE_DIR = process.env.STORAGE_DIR || '/tmp/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'thumbnail'
    const size = searchParams.get('size') || '512'

    // For share links, we allow anonymous access
    // For private access, we need authentication
    const session = await auth()
    const isAuthenticated = !!session?.user

    // Get image from database to check permissions
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
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

    // Check if image is publicly shared
    const isPubliclyShared = image.projectImages.some(
      pi => pi.project.shareTokens.length > 0
    )

    // If not public and not authenticated, deny access
    if (!isPubliclyShared && !isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build file path based on type
    let filePath: string
    let contentType = 'image/jpeg'

    switch (type) {
      case 'thumbnail':
        filePath = path.join(STORAGE_DIR, 'thumbnails', imageId, `thumb-${size}.jpg`)
        break
      case 'preview':
        filePath = path.join(STORAGE_DIR, 'previews', imageId, 'preview.jpg')
        break
      case 'original':
        // Only allow authenticated users to access original
        if (!isAuthenticated) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        filePath = image.tempPath || ''
        contentType = image.mimeType || 'image/jpeg'
        break
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      // Try fallback to temp storage
      if (type === 'preview' || type === 'thumbnail') {
        const tempPath = path.join(process.env.TEMP || '/tmp', 'v0-frame', 'ingest', `${imageId}.jpg`)
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

    // Read file
    const fileBuffer = await fs.readFile(filePath)

    // Return file with proper content type
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
