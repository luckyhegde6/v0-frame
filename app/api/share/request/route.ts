import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, reason } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Check if user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { clientAccess: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if share link already exists
    const existingShare = await prisma.shareToken.findFirst({
      where: { projectId }
    })

    if (existingShare) {
      return NextResponse.json({ 
        error: 'Share link already exists for this project',
        shareId: existingShare.id
      }, { status: 409 })
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.adminTask.findFirst({
      where: {
        type: 'SHARE_REQUEST',
        status: 'PENDING',
        payload: {
          path: ['projectId'],
          equals: projectId
        }
      }
    })

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'A share link request is already pending for this project',
        taskId: existingRequest.id
      }, { status: 409 })
    }

    // Create admin task for share link request
    const task = await prisma.adminTask.create({
      data: {
        type: 'SHARE_REQUEST' as any,
        status: 'PENDING' as any,
        priority: 'MEDIUM' as any,
        title: `Share Link Request: ${project.name}`,
        description: reason || `${session.user.name || session.user.email} requested a share link for project "${project.name}"`,
        payload: {
          projectId,
          projectName: project.name,
          requestedBy: session.user.id,
          requestedByEmail: session.user.email,
          requestedByName: session.user.name,
          requestedAt: new Date().toISOString()
        },
        createdById: session.user.id
      }
    })

    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPERADMIN'] }
      },
      select: { id: true }
    })

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'SHARE_REQUEST',
          title: 'New Share Link Request',
          message: `${session.user.name || session.user.email} requested a share link for project "${project.name}"`,
          metadata: {
            taskId: task.id,
            projectId,
            projectName: project.name
          }
        }))
      })
    }

    // Log the audit event
    await logAuditEvent({
      action: 'SHARE_LINK_REQUESTED',
      entityType: 'ShareRequest',
      entityId: task.id,
      userId: session.user.id,
      metadata: { projectId, projectName: project.name }
    })

    return NextResponse.json({
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.createdAt.toISOString()
      },
      message: 'Share link request submitted successfully. An admin will review it shortly.'
    }, { status: 201 })

  } catch (error) {
    console.error('[ShareRequestAPI] Failed to create share request:', error)
    return NextResponse.json(
      { error: 'Failed to create share request' },
      { status: 500 }
    )
  }
}
