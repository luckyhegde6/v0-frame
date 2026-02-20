import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'

const SETUP_SECRET = process.env.SETUP_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const providedSecret = body.secret || request.headers.get('x-setup-secret')

    if (!SETUP_SECRET) {
      return NextResponse.json(
        { error: 'SETUP_SECRET not configured. Set it in environment variables.' },
        { status: 500 }
      )
    }

    if (providedSecret !== SETUP_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      )
    }

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables' },
        { status: 500 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    if (!existingUser) {
      const newUser = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Super Admin',
          password: hashedPassword,
          role: 'SUPERADMIN',
        },
      })

      await logAuditEvent({
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: newUser.id,
        userId: newUser.id,
        description: `SUPERADMIN created via ensure-superadmin API`,
      })

      return NextResponse.json({
        success: true,
        action: 'created',
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
      })
    }

    const updates: { role?: 'SUPERADMIN'; password?: string } = {}
    
    if (existingUser.role !== 'SUPERADMIN') {
      updates.role = 'SUPERADMIN'
    }

    const passwordMatches = existingUser.password 
      ? await bcrypt.compare(adminPassword, existingUser.password)
      : false

    if (!passwordMatches) {
      updates.password = hashedPassword
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: updates,
      })
    }

    await logAuditEvent({
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: existingUser.id,
      userId: existingUser.id,
      description: `SUPERADMIN ensured via ensure-superadmin API`,
    })

    return NextResponse.json({
      success: true,
      action: 'updated',
      user: { id: existingUser.id, email: existingUser.email, role: 'SUPERADMIN' },
    })
  } catch (error) {
    console.error('Ensure superadmin failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const providedSecret = request.nextUrl.searchParams.get('secret')

  if (!SETUP_SECRET) {
    return NextResponse.json(
      { error: 'SETUP_SECRET not configured' },
      { status: 500 }
    )
  }

  if (providedSecret !== SETUP_SECRET) {
    return NextResponse.json(
      { error: 'Invalid secret' },
      { status: 401 }
    )
  }

  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    return NextResponse.json({
      configured: false,
      message: 'ADMIN_EMAIL not set',
    })
  }

  const user = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, email: true, role: true, name: true },
  })

  return NextResponse.json({
    configured: true,
    adminEmail,
    exists: !!user,
    isSuperAdmin: user?.role === 'SUPERADMIN',
    user,
  })
}
