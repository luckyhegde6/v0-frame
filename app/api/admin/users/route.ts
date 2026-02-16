import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logCritical } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { images: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usersWithCounts = users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      imageCount: u._count.images,
      createdAt: u.createdAt.toISOString(),
    }))

    return NextResponse.json({ users: usersWithCounts })
  } catch (error) {
    logCritical('Failed to fetch users', 'AdminUsersAPI', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
