import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logAlbumImageRemoved, logAlbumImageAdded } from '@/lib/audit'
import { isAdmin, checkAlbumAccess } from '@/lib/auth/access'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: albumId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role

    const access = await checkAlbumAccess(albumId, session.user.id, userRole)
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const album = await prisma.album.findFirst({
      where: { id: albumId }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    // Query images directly owned by album (storageType = ALBUM), exclude soft-deleted
    const ownedImages = await prisma.image.findMany({
      where: { 
        albumId,
        storageType: 'ALBUM',
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' }
    })

    // Also query images linked via AlbumImage junction table (for copied images), exclude soft-deleted
    const linkedImages = await prisma.albumImage.findMany({
      where: { albumId },
      include: {
        image: true
      },
      orderBy: { addedAt: 'desc' }
    })

    // Filter out soft-deleted images in JavaScript (Prisma doesn't support where in include)
    const validLinkedImages = linkedImages
      .filter(ai => ai.image && ai.image.deletedAt === null)
      .map(ai => ai.image)

    // Combine both sets, avoiding duplicates (owned images take precedence)
    const linkedImageIds = new Set(ownedImages.map(img => img.id))
    const allImages = [
      ...ownedImages,
      ...validLinkedImages.filter(img => !linkedImageIds.has(img.id))
    ]

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Helper to get thumbnail URL - returns direct Supabase URL if available, otherwise uses API
    const getThumbnailUrl = (img: typeof allImages[0]) => {
      if (img.thumbnailPath) {
        // If it's already a URL (Supabase), return it directly
        if (img.thumbnailPath.startsWith('http')) {
          return img.thumbnailPath
        }
        // Otherwise, use API endpoint for local storage
        return `${baseUrl}/api/images/${img.id}/file?type=thumbnail&size=512`
      }
      return null
    }

    // Helper to get preview URL - returns direct Supabase URL if available, otherwise uses API
    const getPreviewUrl = (img: typeof allImages[0]) => {
      if (img.previewPath) {
        if (img.previewPath.startsWith('http')) {
          return img.previewPath
        }
        return `${baseUrl}/api/images/${img.id}/file?type=preview`
      }
      return null
    }
    
    // Get user's favorites for these images
    const imageIds = allImages.map(img => img.id)
    const favorites = await prisma.userFavorite.findMany({
      where: {
        userId: session.user.id,
        imageId: { in: imageIds }
      }
    })
    const favoriteSet = new Set(favorites.map(f => f.imageId))
    
    const albumImages = allImages.map(img => ({
      id: img.id,
      title: img.title,
      thumbnailPath: getThumbnailUrl(img),
      previewPath: getPreviewUrl(img),
      width: img.width,
      height: img.height,
      mimeType: img.mimeType,
      sizeBytes: img.sizeBytes,
      createdAt: img.createdAt.toISOString(),
      addedAt: img.createdAt.toISOString(),
      isFavorite: favoriteSet.has(img.id)
    }))

    return NextResponse.json({ images: albumImages })
  } catch (error) {
    console.error('[AlbumImagesAPI] Failed to fetch album images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch album images' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: albumId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role

    const access = await checkAlbumAccess(albumId, session.user.id, userRole)
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const album = await prisma.album.findFirst({
      where: { id: albumId }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, imageIds, targetAlbumId } = body

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: 'Image IDs required' }, { status: 400 })
    }

    const results = { success: 0, failed: 0, errors: [] as string[] }

    if (action === 'move' || action === 'copy') {
      if (!targetAlbumId) {
        return NextResponse.json({ error: 'Target album ID required for move/copy' }, { status: 400 })
      }

      const targetAccess = await checkAlbumAccess(targetAlbumId, session.user.id, userRole)
      if (!targetAccess.hasAccess) {
        return NextResponse.json({ error: 'Target album not found' }, { status: 404 })
      }

      const targetAlbum = await prisma.album.findFirst({
        where: { id: targetAlbumId }
      })

      if (!targetAlbum) {
        return NextResponse.json({ error: 'Target album not found' }, { status: 404 })
      }

      for (const imageId of imageIds) {
        try {
          const image = await prisma.image.findFirst({
            where: { id: imageId, storageType: 'ALBUM' }
          })

          if (!image) {
            results.failed++
            results.errors.push(`Image ${imageId} not found or not an album image`)
            continue
          }

          if (action === 'move') {
            // For move: update the image's albumId directly (change primary ownership)
            await prisma.image.update({
              where: { id: imageId },
              data: { albumId: targetAlbumId }
            })
          } else {
            // For copy: check if already in target album via junction table
            const existingLink = await prisma.albumImage.findFirst({
              where: { albumId: targetAlbumId, imageId }
            })

            if (existingLink) {
              results.failed++
              results.errors.push(`Image ${imageId} already in target album`)
              continue
            }

            // Add to junction table for copy (image still owned by original album)
            await prisma.albumImage.create({
              data: {
                albumId: targetAlbumId,
                imageId
              }
            })
          }

          await logAlbumImageAdded(targetAlbumId, [imageId], session.user.id, { 
            albumName: targetAlbum.name,
            action: action === 'move' ? 'moved' : 'copied'
          })

          results.success++
        } catch (err) {
          results.failed++
          results.errors.push(`Failed to ${action} image ${imageId}: ${err}`)
        }
      }
    } else if (action === 'clone') {
      for (const imageId of imageIds) {
        try {
          const existingImage = await prisma.albumImage.findFirst({
            where: { albumId, imageId }
          })

          if (existingImage) {
            await prisma.albumImage.create({
              data: {
                albumId,
                imageId
              }
            })
          }

          results.success++
        } catch (err) {
          results.failed++
          results.errors.push(`Failed to clone image ${imageId}: ${err}`)
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('[AlbumImagesPUTAPI] Failed to process images:', error)
    return NextResponse.json(
      { error: 'Failed to process images' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: albumId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role

    const access = await checkAlbumAccess(albumId, session.user.id, userRole)
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const album = await prisma.album.findFirst({
      where: { id: albumId }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const body = await request.json()
    const { imageIds } = body

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: 'Image IDs required' }, { status: 400 })
    }

    // Soft-delete images instead of permanent delete
    // Store original album info for restore capability
    await prisma.image.updateMany({
      where: {
        id: { in: imageIds },
        albumId,
        storageType: 'ALBUM'
      },
      data: {
        deletedAt: new Date(),
        deletedFrom: `album:${albumId}`,
        originalAlbumId: albumId,
        albumId: null // Remove from album but keep reference for restore
      }
    })

    await logAlbumImageRemoved(albumId, imageIds, session.user.id, { albumName: album.name })

    return NextResponse.json({ success: true, removedCount: imageIds.length, softDeleted: true })
  } catch (error) {
    console.error('[AlbumImagesRemoveAPI] Failed to remove images:', error)
    return NextResponse.json(
      { error: 'Failed to remove images' },
      { status: 500 }
    )
  }
}
