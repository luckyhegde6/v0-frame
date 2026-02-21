import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')

    const where: Record<string, unknown> = {}
    
    if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'].includes(status)) {
      where.status = status
    }
    
    if (type) {
      where.type = type
    }
    
    if (userId) {
      where.userId = userId
    }

    const requests = await prisma.proRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        project: {
          select: { id: true, name: true }
        },
        album: {
          select: { id: true, name: true }
        }
      }
    })

    const [pendingCount, inProgressCount, completedCount, failedCount] = await Promise.all([
      prisma.proRequest.count({ where: { status: 'PENDING' } }),
      prisma.proRequest.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.proRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.proRequest.count({ where: { status: 'FAILED' } }),
    ])

    return NextResponse.json({
      requests,
      stats: {
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        failed: failedCount,
        total: pendingCount + inProgressCount + completedCount + failedCount
      }
    })
  } catch (error) {
    console.error('[AdminRequestsAPI] Failed to fetch requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { requestId, action, adminNotes, status } = body

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Request ID and action are required' },
        { status: 400 }
      )
    }

    const existingRequest = await prisma.proRequest.findUnique({
      where: { id: requestId }
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }

    switch (action) {
      case 'START':
        if (existingRequest.status !== 'PENDING') {
          return NextResponse.json(
            { error: 'Can only start pending requests' },
            { status: 400 }
          )
        }
        updateData.status = 'IN_PROGRESS'
        updateData.adminNotes = adminNotes || existingRequest.adminNotes
        
        await prisma.notification.create({
          data: {
            type: 'ACCESS_REQUEST',
            title: 'Request Started',
            message: `Your request "${existingRequest.title}" has been started by an admin.`,
            requestor: session.user.email || undefined,
            userId: existingRequest.userId,
            status: 'UNREAD',
            read: false
          }
        })
        break

      case 'COMPLETE':
        if (existingRequest.status !== 'IN_PROGRESS') {
          return NextResponse.json(
            { error: 'Can only complete in-progress requests' },
            { status: 400 }
          )
        }
        updateData.status = 'COMPLETED'
        updateData.completedAt = new Date()
        updateData.completedBy = session.user.id
        updateData.adminNotes = adminNotes || existingRequest.adminNotes
        
        await prisma.notification.create({
          data: {
            type: 'ACCESS_REQUEST',
            title: 'Request Completed',
            message: `Your request "${existingRequest.title}" has been completed.`,
            requestor: session.user.email || undefined,
            userId: existingRequest.userId,
            status: 'UNREAD',
            read: false
          }
        })
        break

      case 'REJECT':
        updateData.status = 'FAILED'
        updateData.completedAt = new Date()
        updateData.completedBy = session.user.id
        updateData.adminNotes = adminNotes || existingRequest.adminNotes
        
        await prisma.notification.create({
          data: {
            type: 'ACCESS_REQUEST',
            title: 'Request Rejected',
            message: `Your request "${existingRequest.title}" has been rejected.${adminNotes ? ` Reason: ${adminNotes}` : ''}`,
            requestor: session.user.email || undefined,
            userId: existingRequest.userId,
            status: 'UNREAD',
            read: false
          }
        })
        break

      case 'UPDATE_NOTES':
        if (!adminNotes) {
          return NextResponse.json(
            { error: 'Notes are required for this action' },
            { status: 400 }
          )
        }
        const existingNotes = existingRequest.adminNotes || ''
        updateData.adminNotes = existingNotes + `\n\n[${new Date().toISOString()}] ${session.user.name || session.user.email}: ${adminNotes}`
        break

      case 'RETRY':
        if (existingRequest.status !== 'FAILED') {
          return NextResponse.json(
            { error: 'Can only retry failed requests' },
            { status: 400 }
          )
        }
        updateData.status = 'PENDING'
        updateData.completedAt = null
        updateData.completedBy = null
        break

      default:
        if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'].includes(status)) {
          updateData.status = status
          if (adminNotes) {
            updateData.adminNotes = adminNotes
          }
        } else {
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          )
        }
    }

    const updatedRequest = await prisma.proRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        project: {
          select: { id: true, name: true }
        },
        album: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error('[AdminRequestsAPI] Failed to update request:', error)
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}
