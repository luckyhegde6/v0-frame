import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (unreadOnly) {
      where.status = 'UNREAD'
    } else if (status && ['UNREAD', 'READ', 'SNOOZED'].includes(status)) {
      where.status = status
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    const unreadCount = await prisma.notification.count({
      where: { status: 'UNREAD' }
    })

    return NextResponse.json({
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error('[NotificationsAPI] Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { type, title, message, requestor, userId, metadata } = body

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        requestor: requestor || null,
        userId: userId || null,
        metadata: metadata || null,
        status: 'UNREAD',
        read: false
      }
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('[NotificationsAPI] Failed to create notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, markAllRead, status, snoozeUntil } = body

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id },
        data: { status: 'READ', read: true }
      })
    } else if (notificationId) {
      const updateData: Record<string, unknown> = {}
      
      if (status) {
        updateData.status = status
        updateData.read = status === 'READ'
      }
      
      if (snoozeUntil) {
        updateData.status = 'SNOOZED'
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: updateData
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[NotificationsAPI] Failed to update notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[NotificationsAPI] Failed to delete notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
