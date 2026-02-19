import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logAlbumCreated } from '@/lib/audit'
import { isAdmin, getAccessibleProjectIds, checkProjectAccess } from '@/lib/auth/access'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    
    let whereClause: { OR?: Array<{ ownerId: string } | { projectId: { in: string[] } }> } = {}
    
    if (!isAdmin(userRole)) {
      const accessibleProjectIds = await getAccessibleProjectIds(session.user.id, userRole)
      whereClause = {
        OR: [
          { ownerId: session.user.id },
          { projectId: { in: accessibleProjectIds } }
        ]
      }
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
      projectId: album.projectId,
      projectName: album.project?.name,
      ownerId: album.ownerId,
      ownerName: album.owner.name,
      ownerEmail: album.owner.email,
      imageCount: album._count.images + album._count.albumImages,
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

    let albumOwnerId = session.user.id

    if (projectId) {
      const projectAccess = await checkProjectAccess(projectId, session.user.id, session.user.role)
      
      if (!projectAccess.hasAccess) {
        return NextResponse.json(
          { error: 'Access denied to this project' },
          { status: 403 }
        )
      }
      
      const project = await prisma.project.findFirst({
        where: { id: projectId }
      })
      
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }
      
      albumOwnerId = project.ownerId
    }

    // Check for duplicate album name in the same project
    const existingAlbum = await prisma.album.findFirst({
      where: {
        name: name.trim(),
        ownerId: albumOwnerId,
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
        ownerId: albumOwnerId,
        projectId: projectId || null
      }
    })

    await logAlbumCreated(album.id, session.user.id, album.projectId || null, { name: album.name, category: album.category })

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
