import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logAlbumDeleted } from '@/lib/audit'

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

    // ADMIN/SUPERADMIN can view any album
    const album = await prisma.album.findFirst({
      where: isAdmin 
        ? { id: albumId }
        : { id: albumId, ownerId: session.user.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { images: true }
        }
      }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    return NextResponse.json({
      album: {
        id: album.id,
        name: album.name,
        description: album.description,
        category: album.category,
        projectId: album.projectId,
        projectName: album.project?.name,
        ownerId: album.ownerId,
        ownerName: album.owner.name,
        ownerEmail: album.owner.email,
        imageCount: album._count.images,
        coverImage: album.coverImage,
        createdAt: album.createdAt.toISOString(),
        updatedAt: album.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('[AlbumAPI] Failed to fetch album:', error)
    return NextResponse.json(
      { error: 'Failed to fetch album' },
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

    const album = await prisma.album.findFirst({
      where: { id: albumId }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const userRole = session.user.role
    const isOwner = album.ownerId === session.user.id
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.album.delete({
      where: { id: albumId }
    })

    await logAlbumDeleted(albumId, album.projectId || '', session.user.id, { name: album.name })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AlbumAPI] Failed to delete album:', error)
    return NextResponse.json(
      { error: 'Failed to delete album' },
      { status: 500 }
    )
  }
}
