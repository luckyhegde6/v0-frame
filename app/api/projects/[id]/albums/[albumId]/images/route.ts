import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logAlbumImageAdded, logAlbumImageRemoved } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; albumId: string }> }
) {
  try {
    const session = await auth()
    const { id: projectId, albumId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'

    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        ...(isAdmin ? {} : { ownerId: session.user.id })
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const album = await prisma.album.findFirst({
      where: { id: albumId, projectId }
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

    return NextResponse.json({
      images: albumImages.map((ai: any) => ({
        id: ai.image.id,
        title: ai.image.title,
        thumbnailPath: ai.image.thumbnailPath,
        previewPath: ai.image.previewPath,
        width: ai.image.width,
        height: ai.image.height,
        sizeBytes: ai.image.sizeBytes,
        status: ai.image.status,
        addedAt: ai.addedAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('[ProjectAlbumImagesAPI] Failed to fetch album images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; albumId: string }> }
) {
  try {
    const session = await auth()
    const { id: projectId, albumId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'

    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        ...(isAdmin ? {} : { ownerId: session.user.id })
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const album = await prisma.album.findFirst({
      where: { id: albumId, projectId }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const body = await request.json()
    const { imageIds } = body

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: 'Image IDs required' }, { status: 400 })
    }

    const existingLinks = await prisma.albumImage.findMany({
      where: { albumId, imageId: { in: imageIds } }
    })

    const existingImageIds = new Set(existingLinks.map((l: any) => l.imageId))
    const newImageIds = imageIds.filter((imgId: string) => !existingImageIds.has(imgId))

    if (newImageIds.length > 0) {
      await prisma.albumImage.createMany({
        data: newImageIds.map((imageId: string) => ({
          albumId,
          imageId
        }))
      })

      await logAlbumImageAdded(albumId, newImageIds, session.user.id, { albumName: album.name })
    }

    return NextResponse.json({
      success: true,
      added: newImageIds.length,
      alreadyExists: existingImageIds.size
    })
  } catch (error) {
    console.error('[ProjectAlbumImagesAPI] Failed to add images:', error)
    return NextResponse.json({ error: 'Failed to add images' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; albumId: string }> }
) {
  try {
    const session = await auth()
    const { id: projectId, albumId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'

    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        ...(isAdmin ? {} : { ownerId: session.user.id })
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const album = await prisma.album.findFirst({
      where: { id: albumId, projectId }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')
    const imageIdsParam = searchParams.get('imageIds')

    let imageIds: string[] = []
    if (imageId) {
      imageIds = [imageId]
    } else if (imageIdsParam) {
      try {
        imageIds = JSON.parse(imageIdsParam)
      } catch {
        return NextResponse.json({ error: 'Invalid imageIds format' }, { status: 400 })
      }
    }

    if (imageIds.length === 0) {
      return NextResponse.json({ error: 'Image ID(s) required' }, { status: 400 })
    }

    await prisma.albumImage.deleteMany({
      where: { albumId, imageId: { in: imageIds } }
    })

    await logAlbumImageRemoved(albumId, imageIds, session.user.id, { albumName: album.name })

    return NextResponse.json({ success: true, removed: imageIds.length })
  } catch (error) {
    console.error('[ProjectAlbumImagesAPI] Failed to remove images:', error)
    return NextResponse.json({ error: 'Failed to remove images' }, { status: 500 })
  }
}
