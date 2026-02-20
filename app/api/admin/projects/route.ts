import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const projects = await prisma.project.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        accessList: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
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

    const formattedProjects = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      eventName: p.eventName,
      startDate: p.startDate?.toISOString() || null,
      branding: p.branding,
      coverImage: p.coverImage,
      ownerId: p.ownerId,
      ownerName: p.owner.name,
      ownerEmail: p.owner.email,
      quotaBytes: p.quotaBytes.toString(),
      storageUsed: p.storageUsed.toString(),
      accessList: p.accessList.map(a => ({
        userId: a.userId,
        userName: a.user.name,
        userEmail: a.user.email,
        accessLevel: a.accessLevel
      })),
      imageCount: p._count.images,
      albumCount: p.albums.length,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString()
    }))

    return NextResponse.json({ projects: formattedProjects })
  } catch (error) {
    console.error('[AdminProjectsAPI] Failed to fetch projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
