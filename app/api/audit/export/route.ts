import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

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
    const format = searchParams.get('format') || 'json'

    const where: {
      action?: AuditAction
      userId?: string
      entityType?: string
      createdAt?: {
        gte?: Date
        lte?: Date
      }
    } = {}

    if (action) {
      where.action = action as AuditAction
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

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const exportData = logs.map(log => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId || '',
      userId: log.userId || '',
      userName: log.userName || log.user?.name || '',
      userEmail: log.userEmail || log.user?.email || '',
      userRole: log.userRole || log.user?.role || '',
      description: log.description || '',
      ipAddress: log.ipAddress || '',
      metadata: log.metadata || {}
    }))

    if (format === 'csv') {
      const headers = [
        'ID', 'Timestamp', 'Action', 'Entity Type', 'Entity ID', 
        'User ID', 'User Name', 'User Email', 'User Role', 
        'Description', 'IP Address', 'Metadata'
      ]
      
      const csvRows = [
        headers.join(','),
        ...exportData.map(row => [
          `"${row.id}"`,
          `"${row.timestamp}"`,
          `"${row.action}"`,
          `"${row.entityType}"`,
          `"${row.entityId}"`,
          `"${row.userId}"`,
          `"${row.userName.replace(/"/g, '""')}"`,
          `"${row.userEmail}"`,
          `"${row.userRole}"`,
          `"${row.description.replace(/"/g, '""')}"`,
          `"${row.ipAddress}"`,
          `"${JSON.stringify(row.metadata).replace(/"/g, '""')}"`
        ].join(','))
      ]

      const csv = csvRows.join('\n')
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      totalRecords: exportData.length,
      filters: { action, userId, entityType, from, to },
      logs: exportData
    })
  } catch (error) {
    console.error('[AuditExportAPI] Failed to export audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    )
  }
}
