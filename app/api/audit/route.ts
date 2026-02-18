import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const entityType = searchParams.get('entityType')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: {
      action?: string
      userId?: string
      entityType?: string
      createdAt?: {
        gte?: Date
        lte?: Date
      }
    } = {}

    if (action) {
      where.action = action as any
    }
    if (userId) {
      where.userId = userId
    }
    if (entityType) {
      where.entityType = entityType
    }
    if (from || to) {
      where.createdAt = {}
      if (from) {
        where.createdAt.gte = new Date(from)
      }
      if (to) {
        where.createdAt.lte = new Date(to)
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.auditLog.count({ where })
    ])

    return NextResponse.json({
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userId: log.userId,
        userEmail: log.userEmail,
        userName: log.userName,
        userRole: log.userRole,
        description: log.description,
        createdAt: log.createdAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('[AuditAPI] Failed to fetch audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
