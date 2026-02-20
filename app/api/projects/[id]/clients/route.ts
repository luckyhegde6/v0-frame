import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logClientAccessGranted, logClientAccessModified } from '@/lib/audit'

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
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'

    const project = await prisma.project.findFirst({
      where: { 
        id,
        ...(isAdmin ? {} : { ownerId: session.user.id })
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const clients = await prisma.clientProjectAccess.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ 
      clients: clients.map(c => ({
        id: c.id,
        userId: c.userId,
        userName: c.user.name,
        userEmail: c.user.email,
        userImage: c.user.image,
        accessLevel: c.accessLevel,
        grantedAt: c.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('[ClientAccessAPI] Failed to fetch clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
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

    const userRole = session.user.role
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'

    const project = await prisma.project.findFirst({
      where: { 
        id,
        ...(isAdmin ? {} : { ownerId: session.user.id })
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const { userId, accessLevel } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user is PRO when assigning to their own project
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existingAccess = await prisma.clientProjectAccess.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId
        }
      }
    })

    if (existingAccess) {
      const updatedAccess = await prisma.clientProjectAccess.update({
        where: { id: existingAccess.id },
        data: { accessLevel: accessLevel || 'READ' }
      })

      await logClientAccessModified(
        id,
        userId,
        existingAccess.accessLevel,
        updatedAccess.accessLevel,
        session.user.id
      )

      return NextResponse.json({
        client: {
          id: updatedAccess.id,
          userId: updatedAccess.userId,
          accessLevel: updatedAccess.accessLevel
        }
      })
    }

    const clientAccess = await prisma.clientProjectAccess.create({
      data: {
        projectId: id,
        userId,
        accessLevel: accessLevel || 'READ',
        grantedById: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    await logClientAccessGranted(
      id,
      userId,
      clientAccess.accessLevel,
      session.user.id,
      { projectName: project.name }
    )

    return NextResponse.json({
      client: {
        id: clientAccess.id,
        userId: clientAccess.userId,
        userName: clientAccess.user.name,
        userEmail: clientAccess.user.email,
        accessLevel: clientAccess.accessLevel,
        grantedAt: clientAccess.createdAt.toISOString()
      }
    }, { status: 201 })
  } catch (error) {
    console.error('[ClientAccessAPI] Failed to grant access:', error)
    return NextResponse.json(
      { error: 'Failed to grant access' },
      { status: 500 }
    )
  }
}
