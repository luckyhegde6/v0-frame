import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logCritical } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: { ownerId: session.user.id },
      include: {
        _count: {
          select: { images: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectsWithStorage = projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      imageCount: p._count.images,
      storageQuota: p.quotaBytes,
      storageUsed: p.storageUsed,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }))

    return NextResponse.json({ projects: projectsWithStorage })
  } catch (error) {
    logCritical('Failed to fetch projects', 'ProjectsAPI', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
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
    const { name, description, quotaBytes } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const existingProject = await prisma.project.findFirst({
      where: {
        name: name.trim(),
        ownerId: session.user.id
      }
    })

    if (existingProject) {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 409 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        quotaBytes: quotaBytes || 10737418240,
        ownerId: session.user.id
      }
    })

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        imageCount: 0,
        storageQuota: project.quotaBytes,
        storageUsed: 0,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }
    }, { status: 201 })
  } catch (error) {
    logCritical('Failed to create project', 'ProjectsAPI', error as Error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
