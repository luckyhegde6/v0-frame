import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { isAdmin, checkProjectAccess } from '@/lib/auth/access'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role

    const access = await checkProjectAccess(id, session.user.id, userRole)
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const albums = await prisma.album.findMany({
      where: { projectId: id },
      include: {
        _count: {
          select: { images: true, albumImages: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const albumsWithCount = albums.map(album => ({
      id: album.id,
      name: album.name,
      description: album.description,
      category: album.category,
      imageCount: album._count.images + album._count.albumImages,
      coverImage: album.coverImage,
      createdAt: album.createdAt.toISOString(),
      updatedAt: album.updatedAt.toISOString()
    }))

    return NextResponse.json({ albums: albumsWithCount })
  } catch (error) {
    console.error('[ProjectAlbumsAPI] Failed to fetch albums:', error)
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    )
  }
}
