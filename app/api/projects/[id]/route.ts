import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

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
      where: { 
        id,
        ownerId: session.user.id 
      },
      include: {
        _count: {
          select: { images: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const images = await prisma.projectImage.findMany({
      where: { projectId: id },
      include: {
        image: true
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalSize = images.reduce((acc: number, pi: any) => acc + (pi.image?.sizeBytes || 0), 0)

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        imageCount: project._count.images,
        storageQuota: project.quotaBytes,
        storageUsed: totalSize,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }
    })
  } catch (error) {
    console.error('[ProjectAPI] Failed to fetch project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const { name, description, quotaBytes } = body

    const existingProject = await prisma.project.findFirst({
      where: { 
        id,
        ownerId: session.user.id 
      }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (name && name.trim() !== existingProject.name) {
      const duplicate = await prisma.project.findFirst({
        where: {
          name: name.trim(),
          ownerId: session.user.id,
          NOT: { id }
        }
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'A project with this name already exists' },
          { status: 409 }
        )
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: name?.trim() || undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        quotaBytes: quotaBytes || undefined
      }
    })

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        storageQuota: project.quotaBytes,
        updatedAt: project.updatedAt
      }
    })
  } catch (error) {
    console.error('[ProjectAPI] Failed to update project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
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
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingProject = await prisma.project.findFirst({
      where: { 
        id,
        ownerId: session.user.id 
      }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ProjectAPI] Failed to delete project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
