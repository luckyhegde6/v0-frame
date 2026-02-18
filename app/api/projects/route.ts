import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logProjectCreated } from '@/lib/audit'

function serializeBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return obj.toString()
  if (Array.isArray(obj)) return obj.map(serializeBigInt)
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, serializeBigInt(v)])
    )
  }
  return obj
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    
    // ADMIN and SUPERADMIN can see all projects
    let whereClause = {}
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      whereClause = { ownerId: session.user.id }
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { images: true }
        },
        albums: {
          select: { id: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const projectsWithStorage = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      eventName: p.eventName,
      startDate: p.startDate,
      branding: p.branding,
      coverImage: p.coverImage,
      ownerId: p.ownerId,
      ownerName: p.owner.name,
      ownerEmail: p.owner.email,
      imageCount: p._count.images,
      albumCount: p.albums.length,
      storageQuota: p.quotaBytes.toString(),
      storageUsed: p.storageUsed.toString(),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }))

    return NextResponse.json({ projects: projectsWithStorage })
  } catch (error) {
    console.error('[ProjectsAPI] Failed to fetch projects:', error)
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
    const { 
      name, 
      description, 
      quotaBytes,
      eventName,
      startDate,
      branding,
      watermarkImage,
      coverImage
    } = body

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
        quotaBytes: BigInt(quotaBytes || '10737418240'),
        ownerId: session.user.id,
        eventName: eventName?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        branding: branding || false,
        watermarkImage: watermarkImage || null,
        coverImage: coverImage || null
      }
    })

    await logProjectCreated(project.id, session.user.id, { name: project.name, eventName: project.eventName })

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        imageCount: 0,
        storageQuota: project.quotaBytes.toString(),
        storageUsed: '0',
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }
    }, { status: 201 })
  } catch (error) {
    console.error('[ProjectsAPI] Failed to create project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
