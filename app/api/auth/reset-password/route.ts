import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { Role } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      )
    }

    if (user.role === Role.ADMIN || user.role === Role.SUPERADMIN) {
      return NextResponse.json(
        { error: 'Administrator accounts cannot use self-service password reset. Please contact your system administrator.' },
        { status: 403 }
      )
    }

    const existingRequest = await prisma.passwordReset.findFirst({
      where: {
        email,
        status: 'PENDING',
        tokenExpires: { gt: new Date() }
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A password reset request already exists. Please wait for it to be processed.' },
        { status: 400 }
      )
    }

    const token = randomBytes(32).toString('hex')
    const tokenExpires = new Date()
    tokenExpires.setHours(tokenExpires.getHours() + 24)

    await prisma.passwordReset.create({
      data: {
        email,
        token,
        tokenExpires,
        isMagicLink: true,
        status: 'PENDING'
      }
    })

    await prisma.notification.create({
      data: {
        type: 'PASSWORD_RESET_REQUEST',
        title: 'Password Reset Request',
        message: `User ${email} has requested a password reset.`,
        requestor: email,
        userId: null,
        status: 'UNREAD',
        read: false
      }
    })

    return NextResponse.json({
      message: 'Password reset request submitted successfully'
    })
  } catch (error) {
    console.error('[PasswordResetAPI] Failed to create reset request:', error)
    return NextResponse.json(
      { error: 'Failed to submit password reset request' },
      { status: 500 }
    )
  }
}
