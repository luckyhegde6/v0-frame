import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const requests = await prisma.passwordReset.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('[AdminPasswordResetAPI] Failed to fetch requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
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
    const { requestId, action, hint } = body

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Request ID and action are required' },
        { status: 400 }
      )
    }

    const resetRequest = await prisma.passwordReset.findUnique({
      where: { id: requestId }
    })

    if (!resetRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    if (resetRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      const token = resetRequest.token
      
      await prisma.passwordReset.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          hint: hint || null,
          completedAt: new Date(),
          completedBy: session.user.id
        }
      })

      await prisma.notification.create({
        data: {
          type: 'PASSWORD_RESET_COMPLETED',
          title: 'Password Reset Link Sent',
          message: `Your password reset link has been sent to your email. Use the hint: ${hint || 'No hint provided'}`,
          requestor: session.user.email || undefined,
          userId: null,
          status: 'UNREAD',
          read: false
        }
      })

      const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}&email=${resetRequest.email}`

      return NextResponse.json({
        success: true,
        message: 'Password reset approved',
        magicLink
      })
    } else if (action === 'reject') {
      await prisma.passwordReset.update({
        where: { id: requestId },
        data: {
          status: 'EXPIRED',
          completedAt: new Date(),
          completedBy: session.user.id
        }
      })

      await prisma.notification.create({
        data: {
          type: 'PASSWORD_RESET_REQUEST',
          title: 'Password Reset Rejected',
          message: 'Your password reset request has been rejected. Please contact support.',
          requestor: session.user.email || undefined,
          userId: null,
          status: 'UNREAD',
          read: false
        }
      })

      return NextResponse.json({ success: true, message: 'Request rejected' })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[AdminPasswordResetAPI] Failed to process request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
