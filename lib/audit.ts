import prisma from '@/lib/prisma'

export type AuditAction = 
  | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'USER_LOGIN' | 'USER_LOGOUT'
  | 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'PROJECT_DELETED'
  | 'ALBUM_CREATED' | 'ALBUM_UPDATED' | 'ALBUM_DELETED'
  | 'SHARE_LINK_CREATED' | 'SHARE_LINK_REVOKED' | 'SHARE_LINK_ACCESSED'
  | 'JOB_CREATED' | 'JOB_STARTED' | 'JOB_COMPLETED' | 'JOB_FAILED'
  | 'IMAGE_UPLOADED' | 'IMAGE_DELETED'
  | 'CLIENT_ACCESS_GRANTED' | 'CLIENT_ACCESS_REVOKED'
  | 'SETTINGS_CHANGED'

interface AuditLogParams {
  action: AuditAction
  entityType: string
  entityId: string
  userId: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function logAuditEvent({
  action,
  entityType,
  entityId,
  userId,
  metadata,
  ipAddress,
  userAgent
}: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        user: userId ? { connect: { id: userId } } : undefined,
        metadata: metadata || {},
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
      }
    })
  } catch (error) {
    console.error('[Audit] Failed to log event:', error)
  }
}

export async function logProjectCreated(projectId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'PROJECT_CREATED',
    entityType: 'Project',
    entityId: projectId,
    userId,
    metadata
  })
}

export async function logProjectDeleted(projectId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'PROJECT_DELETED',
    entityType: 'Project',
    entityId: projectId,
    userId,
    metadata
  })
}

export async function logAlbumCreated(albumId: string, projectId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'ALBUM_CREATED',
    entityType: 'Album',
    entityId: albumId,
    userId,
    metadata: { ...metadata, projectId }
  })
}

export async function logAlbumDeleted(albumId: string, projectId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'ALBUM_DELETED',
    entityType: 'Album',
    entityId: albumId,
    userId,
    metadata: { ...metadata, projectId }
  })
}

export async function logImageUploaded(imageId: string, projectId: string | null, albumId: string | null, userId: string) {
  return logAuditEvent({
    action: 'IMAGE_UPLOADED',
    entityType: 'Image',
    entityId: imageId,
    userId,
    metadata: { projectId, albumId }
  })
}

export async function logClientAccessGranted(projectId: string, clientUserId: string, accessLevel: string, grantedByUserId: string) {
  return logAuditEvent({
    action: 'CLIENT_ACCESS_GRANTED',
    entityType: 'Project',
    entityId: projectId,
    userId: grantedByUserId,
    metadata: { clientUserId, accessLevel }
  })
}

export async function logClientAccessRevoked(projectId: string, clientUserId: string, revokedByUserId: string) {
  return logAuditEvent({
    action: 'CLIENT_ACCESS_REVOKED',
    entityType: 'Project',
    entityId: projectId,
    userId: revokedByUserId,
    metadata: { clientUserId }
  })
}
