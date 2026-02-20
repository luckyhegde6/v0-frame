import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

// Generate description from action and metadata
function generateDescription(
  action: AuditAction,
  entityType: string,
  metadata?: Record<string, unknown> | null,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null
): string {
  switch (action) {
    case 'USER_CREATED':
      return `New user created${metadata?.email ? `: ${metadata.email}` : ''}${metadata?.name ? ` (${metadata.name})` : ''}`
    case 'USER_UPDATED':
      return `User profile updated`
    case 'USER_DELETED':
      return `User deleted${metadata?.email ? `: ${metadata.email}` : ''}`
    case 'USER_ROLE_CHANGED':
      return `Role changed from "${oldValue?.role || 'none'}" to "${newValue?.role}"`
    case 'USER_LOGIN':
      return `User logged in successfully`
    case 'USER_LOGOUT':
      return `User logged out`
    case 'USER_PASSWORD_CHANGED':
      return `Password changed`
    case 'PROJECT_CREATED':
      return `Project created: "${metadata?.name || 'Unnamed'}"${metadata?.eventName ? ` for event: ${metadata.eventName}` : ''}`
    case 'PROJECT_UPDATED':
      return `Project updated${metadata?.name ? `: ${metadata.name}` : ''}`
    case 'PROJECT_DELETED':
      return `Project deleted${metadata?.name ? `: ${metadata.name}` : ''}`
    case 'ALBUM_CREATED':
      return `Album created: "${metadata?.name || 'Unnamed'}"${metadata?.projectId ? ` in project` : ''}`
    case 'ALBUM_UPDATED':
      return `Album updated${metadata?.name ? `: ${metadata.name}` : ''}`
    case 'ALBUM_DELETED':
      return `Album deleted${metadata?.name ? `: ${metadata.name}` : ''}`
    case 'ALBUM_IMAGE_ADDED':
      return `${metadata?.count || 1} image(s) added to album${metadata?.albumName ? ` "${metadata.albumName}"` : ''}`
    case 'ALBUM_IMAGE_REMOVED':
      return `${metadata?.count || 1} image(s) removed from album`
    case 'ALBUM_SETTINGS_CHANGED':
      return `Album settings updated`
    case 'IMAGE_UPLOADED':
      return `Image uploaded${metadata?.albumId ? ' to album' : metadata?.projectId ? ' to project' : ''}`
    case 'IMAGE_DELETED':
      return `Image deleted`
    case 'IMAGE_MOVED':
      return `Image moved from "${metadata?.fromLocation || 'unknown'}" to "${metadata?.toLocation || 'unknown'}"`
    case 'IMAGE_COPIED':
      return `Image copied to "${metadata?.toLocation || 'unknown'}"`
    case 'IMAGE_CLONED':
      return `${metadata?.count || 1} image(s) cloned`
    case 'JOB_CREATED':
      return `Job created: ${metadata?.jobType || 'Unknown type'}`
    case 'JOB_STARTED':
      return `Job started processing`
    case 'JOB_COMPLETED':
      return `Job completed successfully`
    case 'JOB_FAILED':
      return `Job failed${metadata?.error ? `: ${metadata.error}` : ''}`
    case 'CLIENT_ACCESS_GRANTED':
      return `Access granted with "${metadata?.accessLevel || 'READ'}" level`
    case 'CLIENT_ACCESS_REVOKED':
      return `Access revoked`
    case 'CLIENT_ACCESS_MODIFIED':
      return `Access level changed from "${oldValue?.accessLevel || 'none'}" to "${newValue?.accessLevel}"`
    case 'SHARE_LINK_CREATED':
      return `Share link created${metadata?.projectId ? ' for project' : metadata?.albumId ? ' for album' : ''}`
    case 'SHARE_LINK_REVOKED':
      return `Share link revoked`
    case 'SHARE_LINK_ACCESSED':
      return `Share link accessed`
    case 'SETTINGS_CHANGED':
      return `Settings changed`
    case 'STORAGE_QUOTA_CHANGED':
      return `Storage quota changed`
    case 'STORAGE_WARNING':
      return `Storage warning: ${metadata?.usagePercent || 0}% used`
    case 'SYSTEM_CONFIG_CHANGED':
      return `System configuration changed`
    case 'BULK_OPERATION':
      return `Bulk operation: ${metadata?.operation || 'Unknown'} (${metadata?.affectedCount || 0} affected)`
    default:
      return action.replace(/_/g, ' ').toLowerCase()
  }
}

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

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.auditLog.count({ where })
    ])

    return NextResponse.json({
      logs: logs.map(log => {
        // Use stored user info, or fallback to relation
        const userName = log.userName || log.user?.name || null
        const userEmail = log.userEmail || log.user?.email || null
        const userRole = log.userRole || log.user?.role || null
        
        // Use stored description, or generate from metadata
        const description = log.description || generateDescription(
          log.action,
          log.entityType,
          log.metadata as Record<string, unknown> | null,
          log.oldValue as Record<string, unknown> | null,
          log.newValue as Record<string, unknown> | null
        )
        
        return {
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          userId: log.userId,
          userEmail,
          userName,
          userRole,
          description,
          createdAt: log.createdAt.toISOString()
        }
      }),
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
