import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

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
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'

    const album = await prisma.album.findFirst({
      where: isAdmin 
        ? { id: albumId }
        : { id: albumId, ownerId: session.user.id }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const albumImages = await prisma.albumImage.findMany({
      where: { albumId },
      include: {
        image: true
      },
      orderBy: { addedAt: 'desc' }
    })

    const images = albumImages.map(ai => ({
      id: ai.image.id,
      title: ai.image.title,
      thumbnailPath: ai.image.thumbnailPath,
      previewPath: ai.image.previewPath,
      width: ai.image.width,
      height: ai.image.height,
      mimeType: ai.image.mimeType,
      sizeBytes: ai.image.sizeBytes,
      createdAt: ai.image.createdAt.toISOString()
    }))

    return NextResponse.json({ images })
  } catch (error) {
    console.error('[AlbumImagesAPI] Failed to fetch album images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch album images' },
      { status: 500 }
    )
  }
}
