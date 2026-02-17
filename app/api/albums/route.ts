import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const albums = await prisma.album.findMany({
      where: { ownerId: session.user.id },
      include: {
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
    const { name, description, category } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Album name is required' },
        { status: 400 }
      )
    }

    const existingAlbum = await prisma.album.findFirst({
      where: {
        name: name.trim(),
        ownerId: session.user.id
      }
    })

    if (existingAlbum) {
      return NextResponse.json(
        { error: 'An album with this name already exists' },
        { status: 409 }
      )
    }

    const album = await prisma.album.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category || 'PHOTO_ALBUM',
        ownerId: session.user.id
      }
    })

    return NextResponse.json({
      album: {
        id: album.id,
        name: album.name,
        description: album.description,
        category: album.category,
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
