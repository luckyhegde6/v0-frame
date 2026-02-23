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
    
    if (!isAdmin(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const days = searchParams.get('days')

    // Build query
    const where: any = {
      deletedAt: { not: null }
    }

    if (userId) {
      where.userId = userId
    }

    if (days) {
      const date = new Date()
      date.setDate(date.getDate() - parseInt(days))
      where.deletedAt = { gte: date }
    }

    const images = await prisma.image.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        album: {
          select: { id: true, name: true }
        }
      },
      orderBy: { deletedAt: 'desc' },
      take: 100
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
      userId: img.userId,
      userName: img.user.name,
      userEmail: img.user.email,
      createdAt: img.createdAt.toISOString()
    }))

    return NextResponse.json({ images: deletedImages })
  } catch (error) {
    console.error('[AdminTrashAPI] Failed to fetch trash:', error)
    return NextResponse.json({ error: 'Failed to fetch trash' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    
    if (!isAdmin(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { imageIds, action, targetUserId, targetAlbumId } = body

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: 'Image IDs required' }, { status: 400 })
    }

    if (action === 'restore') {
      // Admin can restore to any album or user's gallery
      for (const imageId of imageIds) {
        const image = await prisma.image.findFirst({
          where: { 
            id: imageId,
            deletedAt: { not: null }
          }
        })

        if (image) {
          const updateData: any = {
            deletedAt: null,
            deletedFrom: null,
            originalAlbumId: null
          }

          if (targetAlbumId) {
            updateData.albumId = targetAlbumId
            updateData.storageType = 'ALBUM'
          } else if (targetUserId) {
            updateData.albumId = null
            updateData.storageType = 'GALLERY'
            updateData.userId = targetUserId
          } else if (image.originalAlbumId) {
            updateData.albumId = image.originalAlbumId
          }

          await prisma.image.update({
            where: { id: imageId },
            data: updateData
          })
        }
      }
      return NextResponse.json({ success: true, restoredCount: imageIds.length })
    } 
    
    if (action === 'permanent-delete') {
      // Permanently delete images
      await prisma.image.deleteMany({
        where: {
          id: { in: imageIds },
          deletedAt: { not: null }
        }
      })
      return NextResponse.json({ success: true, deletedCount: imageIds.length, permanent: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[AdminTrashAPI] Failed to process trash action:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}
