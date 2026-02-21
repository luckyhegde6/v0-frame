import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email, password } = body

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: 'Token, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6 || password.length > 16) {
      return NextResponse.json(
        { error: 'Password must be between 6 and 16 characters' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      return NextResponse.json(
        { error: 'Password must be alphanumeric only (letters and numbers only)' },
        { status: 400 }
      )
    }

    const resetRequest = await prisma.passwordReset.findFirst({
      where: {
        token,
        email,
        status: 'PENDING',
        tokenExpires: { gt: new Date() }
      }
    })

    if (!resetRequest) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    await prisma.passwordReset.update({
      where: { id: resetRequest.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Password reset successfully'
    })
  } catch (error) {
    console.error('[PasswordResetConfirmAPI] Failed to reset password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
