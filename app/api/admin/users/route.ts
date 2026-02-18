import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Returns a list of all users with their image counts
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}

    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: { images: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
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
    console.error('[AdminUsersAPI] Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
