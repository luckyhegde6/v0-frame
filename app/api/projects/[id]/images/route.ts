import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logAlbumImageAdded } from '@/lib/audit'

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

    const project = await prisma.project.findFirst({
      where: { id, ownerId: session.user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const projectImages = await prisma.projectImage.findMany({
      where: { projectId: id },
      include: {
        image: true
      },
      orderBy: { addedAt: 'desc' }
    })

    return NextResponse.json({
      images: projectImages.map((pi) => ({
        id: pi.image.id,
        title: pi.image.title,
        status: pi.image.status,
        sizeBytes: pi.image.sizeBytes,
        width: pi.image.width,
        height: pi.image.height,
        mimeType: pi.image.mimeType,
        thumbnailPath: pi.image.thumbnailPath,
        previewPath: pi.image.previewPath,
        addedAt: pi.addedAt
      }))
    })
  } catch (error) {
    console.error('[ProjectImagesAPI] Failed to fetch project images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageIds } = body

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: 'Image IDs are required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findFirst({
      where: { id, ownerId: session.user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const existingLinks = await prisma.projectImage.findMany({
      where: {
        projectId: id,
        imageId: { in: imageIds }
      }
    })

    const existingImageIds = new Set(existingLinks.map((l) => l.imageId))
    const newImageIds = imageIds.filter((imgId: string) => !existingImageIds.has(imgId))

    if (newImageIds.length > 0) {
      await prisma.projectImage.createMany({
        data: newImageIds.map((imageId: string) => ({
          projectId: id,
          imageId
        }))
      })
    }

    return NextResponse.json({
      success: true,
      added: newImageIds.length,
      alreadyExists: existingImageIds.size
    })
  } catch (error) {
    console.error('[ProjectImagesAPI] Failed to add images to project:', error)
    return NextResponse.json(
      { error: 'Failed to add images' },
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
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: { id, ownerId: session.user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (imageId) {
      await prisma.projectImage.deleteMany({
        where: { projectId: id, imageId }
      })
    } else {
      await prisma.projectImage.deleteMany({
        where: { projectId: id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ProjectImagesAPI] Failed to remove images from project:', error)
    return NextResponse.json(
      { error: 'Failed to remove images' },
      { status: 500 }
    )
  }
}
