import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - No active session' },
        { status: 401 }
      )
    }

    const rawToken = randomBytes(32).toString('hex')

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    return NextResponse.json({
      token: rawToken,
      expiresAt: expiresAt.toISOString(),
      expiresIn: '24h',
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
      usage: {
        header: 'Authorization',
        format: 'Bearer <token>',
        cookie: 'next-auth.session-token'
      },
      message: 'Token generated successfully. Use this token in the Authorization header.'
    })
  } catch (error) {
    console.error('[TokenAPI] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}
