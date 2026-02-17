import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    const where: Record<string, unknown> = {
      OR: [
        { userId: session.user.id },
        { userId: null }
      ]
    }

    if (unreadOnly) {
      where.status = 'UNREAD'
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const unreadCount = await prisma.notification.count({
      where: {
        OR: [
          { userId: session.user.id },
          { userId: null }
        ],
        status: 'UNREAD'
      }
    })

    return NextResponse.json({
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
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
    const { notificationId, markAllRead, status } = body

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: {
          OR: [
            { userId: session.user.id },
            { userId: null }
          ]
        },
        data: { status: 'READ', read: true }
      })
    } else if (notificationId) {
      const updateData: Record<string, unknown> = {}
      
      if (status) {
        updateData.status = status
        updateData.read = status === 'READ'
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: updateData
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}
