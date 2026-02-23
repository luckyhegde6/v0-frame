import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { isAdmin } from '@/lib/auth/access'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    
    // Get deleted images for this user
    const images = await prisma.image.findMany({
      where: {
        userId: session.user.id,
        deletedAt: { not: null }
      },
      include: {
        album: {
          select: { id: true, name: true }
        }
      },
      orderBy: { deletedAt: 'desc' }
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const deletedImages = images.map(img => ({
      id: img.id,
      title: img.title,
      thumbnailPath: img.thumbnailPath 
        ? (img.thumbnailPath.startsWith('http') ? img.thumbnailPath : `${baseUrl}/api/images/${img.id}/file?type=thumbnail&size=512`)
        : null,
      previewPath: img.previewPath 
        ? (img.previewPath.startsWith('http') ? img.previewPath : `${baseUrl}/api/images/${img.id}/file?type=preview`)
        : null,
      width: img.width,
      height: img.height,
      mimeType: img.mimeType,
      sizeBytes: img.sizeBytes,
      deletedAt: img.deletedAt?.toISOString(),
      deletedFrom: img.deletedFrom,
      originalAlbumId: img.originalAlbumId,
      albumName: img.album?.name || null,
      createdAt: img.createdAt.toISOString()
    }))

    return NextResponse.json({ images: deletedImages })
  } catch (error) {
    console.error('[TrashAPI] Failed to fetch trash:', error)
    return NextResponse.json({ error: 'Failed to fetch trash' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageIds, action } = body

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: 'Image IDs required' }, { status: 400 })
    }

    const userRole = session.user.role

    if (action === 'restore') {
      // Restore images to their original album
      for (const imageId of imageIds) {
        const image = await prisma.image.findFirst({
          where: { 
            id: imageId,
            userId: session.user.id,
            deletedAt: { not: null }
          }
        })

        if (image && image.originalAlbumId) {
          await prisma.image.update({
            where: { id: imageId },
            data: {
              albumId: image.originalAlbumId,
              deletedAt: null,
              deletedFrom: null,
              originalAlbumId: null
            }
          })
        }
      }
      return NextResponse.json({ success: true, restoredCount: imageIds.length })
    } 
    
    if (action === 'permanent-delete') {
      // Only allow admins to permanently delete, or users can only restore
      // For PRO users, they can only restore - permanent delete is admin only
      if (!isAdmin(userRole)) {
        return NextResponse.json({ error: 'Permanent delete not allowed. Only restore available.' }, { status: 403 })
      }

      // Permanently delete images
      await prisma.image.deleteMany({
        where: {
          id: { in: imageIds },
          userId: session.user.id,
          deletedAt: { not: null }
        }
      })
      return NextResponse.json({ success: true, deletedCount: imageIds.length, permanent: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[TrashAPI] Failed to process trash action:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}
