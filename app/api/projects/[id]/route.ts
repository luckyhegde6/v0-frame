import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logProjectUpdated, logProjectDeleted } from '@/lib/audit'
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

    const project = await prisma.project.findFirst({
      where: { id },
      include: {
        albums: {
          include: {
            _count: {
              select: { images: true }
            }
          }
        },
        _count: {
          select: { images: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Count all images: direct project images + album images
    const directImageCount = project._count.images
    const albumImageCount = project.albums.reduce((acc, album) => acc + album._count.images, 0)
    const totalImageCount = directImageCount + albumImageCount

    // Get total size from direct project images
    const directImages = await prisma.projectImage.findMany({
      where: { projectId: id },
      include: {
        image: true
      }
    })

    // Get total size from album images
    const albumIds = project.albums.map(a => a.id)
    const albumImages = albumIds.length > 0 ? await prisma.image.findMany({
      where: {
        albumId: { in: albumIds },
        storageType: 'ALBUM'
      }
    }) : []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const directSize = directImages.reduce((acc: number, pi: any) => acc + (pi.image?.sizeBytes || 0), 0)
    const albumSize = albumImages.reduce((acc, img) => acc + (img.sizeBytes || 0), 0)
    const totalSize = directSize + albumSize

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        eventName: project.eventName,
        startDate: project.startDate,
        branding: project.branding,
        watermarkImage: project.watermarkImage,
        coverImage: project.coverImage,
        imageCount: totalImageCount,
        storageQuota: project.quotaBytes.toString(),
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

    const access = await checkProjectAccess(id, session.user.id, session.user.role)
    
    if (!access.hasAccess || (access.accessLevel !== 'FULL' && !isAdmin(session.user.role))) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    const existingProject = await prisma.project.findFirst({
      where: { id }
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

    await logProjectUpdated(
      id,
      session.user.id,
      { name: existingProject.name, description: existingProject.description },
      { name: project.name, description: project.description }
    )

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

    const access = await checkProjectAccess(id, session.user.id, session.user.role)
    
    if (!access.hasAccess || (access.accessLevel !== 'FULL' && !isAdmin(session.user.role))) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    const existingProject = await prisma.project.findFirst({
      where: { id }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.project.delete({
      where: { id }
    })

    await logProjectDeleted(id, session.user.id, { name: existingProject.name })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ProjectAPI] Failed to delete project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
