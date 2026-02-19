import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Admin gallery only shows GALLERY type images
    // ALBUM type images are managed via /api/admin/albums
    const where: Record<string, unknown> = {
      storageType: 'GALLERY'
    }
    if (userId) {
      where.userId = userId
    }

    const [images, collections, projects] = await Promise.all([
      prisma.image.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      prisma.collection.findMany({
        where: userId ? { userId } : {},
        include: {
          _count: { select: { images: true } }
        }
      }),
      prisma.project.findMany({
        where: userId ? { ownerId: userId } : {},
        include: {
          _count: { select: { images: true } }
        }
      })
    ])

    return NextResponse.json({
      images: images.map((img) => ({
        id: img.id,
        title: img.title,
        userId: img.userId,
        sizeBytes: img.sizeBytes,
        status: img.status,
        storageType: img.storageType,
        createdAt: img.createdAt
      })),
      collections: collections.map((c) => ({
        id: c.id,
        name: c.name,
        userId: c.userId,
        imageCount: c._count.images,
        createdAt: c.createdAt
      })),
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        ownerId: p.ownerId,
        imageCount: p._count.images,
        createdAt: p.createdAt
      }))
    })
  } catch (error) {
    console.error('[GalleryAdminAPI] Failed to fetch gallery data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery data' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      )
    }

    if (type === 'image') {
      // Only allow deleting GALLERY type images from admin gallery
      // ALBUM images should be deleted via album management
      const image = await prisma.image.findUnique({
        where: { id },
        select: { storageType: true }
      })
      
      if (!image) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 })
      }
      
      if (image.storageType !== 'GALLERY') {
        return NextResponse.json(
          { error: 'Only GALLERY images can be deleted here. Use album management for ALBUM images.' },
          { status: 400 }
        )
      }
      
      await prisma.image.delete({ where: { id } })
    } else if (type === 'collection') {
      await prisma.collection.delete({ where: { id } })
    } else if (type === 'project') {
      await prisma.project.delete({ where: { id } })
    } else {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[GalleryAdminAPI] Failed to delete gallery item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}
