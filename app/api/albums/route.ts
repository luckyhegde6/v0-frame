import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logAlbumCreated } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    
    // ADMIN and SUPERADMIN can see all albums
    let whereClause: { ownerId?: string } = {}
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      whereClause = { ownerId: session.user.id }
    }

    const albums = await prisma.album.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true }
        },
        owner: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { images: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const albumsWithCount = albums.map(album => ({
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
    }))

    return NextResponse.json({ albums: albumsWithCount })
  } catch (error) {
    console.error('[AlbumsAPI] Failed to fetch albums:', error)
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, projectId } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Album name is required' },
        { status: 400 }
      )
    }

    // Validate projectId if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { 
          id: projectId,
          ownerId: session.user.id
        }
      })
      
      // ADMIN/SUPERADMIN can create albums in any project
      if (!project && session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        )
      }
    }

    const existingAlbum = await prisma.album.findFirst({
      where: {
        name: name.trim(),
        ownerId: session.user.id,
        projectId: projectId || null
      }
    })

    if (existingAlbum) {
      return NextResponse.json(
        { error: 'An album with this name already exists in this project' },
        { status: 409 }
      )
    }

    const album = await prisma.album.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category || 'PHOTO_ALBUM',
        ownerId: session.user.id,
        projectId: projectId || null
      }
    })

    await logAlbumCreated(album.id, album.projectId || '', session.user.id, { name: album.name, category: album.category })

    return NextResponse.json({
      album: {
        id: album.id,
        name: album.name,
        description: album.description,
        category: album.category,
        projectId: album.projectId,
        imageCount: 0,
        coverImage: album.coverImage,
        createdAt: album.createdAt.toISOString(),
        updatedAt: album.updatedAt.toISOString()
      }
    }, { status: 201 })
  } catch (error) {
    console.error('[AlbumsAPI] Failed to create album:', error)
    return NextResponse.json(
      { error: 'Failed to create album' },
      { status: 500 }
    )
  }
}
