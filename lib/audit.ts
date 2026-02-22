import prisma from '@/lib/prisma'
import { Prisma, Role, AuditAction } from '@prisma/client'

export type { AuditAction }

interface AuditLogParams {
  action: AuditAction
  entityType: string
  entityId: string
  userId?: string
  metadata?: Record<string, unknown>
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  description?: string
}

function generateDescription(
  action: AuditAction,
  entityType: string,
  metadata?: Record<string, unknown>,
  oldValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>
): string {
  switch (action) {
    case 'USER_CREATED':
      return `New user created${metadata?.email ? `: ${metadata.email}` : ''}${metadata?.name ? ` (${metadata.name})` : ''}`
    case 'USER_UPDATED':
      const userChanges = []
      if (oldValue && newValue) {
        for (const key of Object.keys(newValue)) {
          if (oldValue[key] !== newValue[key]) {
            userChanges.push(`${key}: "${oldValue[key] || 'none'}" → "${newValue[key]}"`)
          }
        }
      }
      return `User updated${userChanges.length ? ` - ${userChanges.join(', ')}` : ''}`
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
    case 'JOB_RETRY':
      return `Job manually retried by admin (attempt ${metadata?.attempt || 1})`
    case 'JOB_CANCELLED':
      return `Job manually cancelled by admin`
    case 'JOB_FORCE_RUN':
      return `Job force-started by admin`
    case 'CLIENT_ACCESS_GRANTED':
      return `Access granted to user with "${metadata?.accessLevel || 'READ'}" level`
    case 'CLIENT_ACCESS_REVOKED':
      return `Access revoked from user`
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
      return `Storage quota changed from ${oldValue?.quotaBytes || 'unlimited'} to ${newValue?.quotaBytes || 'unlimited'}`
    case 'STORAGE_WARNING':
      return `Storage warning: ${metadata?.usagePercent || 0}% used`
    case 'SYSTEM_CONFIG_CHANGED':
      return `System configuration changed`
    case 'BULK_OPERATION':
      return `Bulk operation: ${metadata?.operation || 'Unknown'} (${metadata?.affectedCount || 0} affected)`
    case 'IMAGE_DOWNLOADED':
      return `Image downloaded`
    case 'ALBUM_DOWNLOADED':
      return `Album downloaded (${metadata?.imageCount || 0} images)`
    case 'PRO_REQUEST_SUBMITTED':
      return `PRO request submitted: ${metadata?.requestType || 'Unknown'}`
    case 'PROJECT_EXPORT_REQUESTED':
      return `Project export requested`
    case 'FACE_RECOGNITION_REQUESTED':
      return `Face recognition requested for album`
    case 'WATERMARK_REQUESTED':
      return `Watermark settings change requested`
    case 'SHARE_LINK_REQUESTED':
      return `Share link requested`
    default:
      return `${action} performed on ${entityType}`
  }
}

export async function logAuditEvent({
  action,
  entityType,
  entityId,
  userId,
  metadata,
  oldValue,
  newValue,
  ipAddress,
  userAgent,
  description
}: AuditLogParams): Promise<void> {
  try {
    // Fetch user info if userId is provided
    let userInfo: { email: string | null; name: string | null; role: Role | null } | null = null
    if (userId && userId !== 'system' && userId !== 'anonymous') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, role: true }
      })
      userInfo = user
    }
    
    // Generate description if not provided
    const finalDescription = description || generateDescription(action, entityType, metadata, oldValue, newValue)
    
    await prisma.auditLog.create({ 
      data: {
        action,
        entityType,
        entityId,
        userId: (userId && userId !== 'system' && userId !== 'anonymous') ? userId : null,
        userEmail: userInfo?.email || null,
        userName: userInfo?.name || null,
        userRole: userInfo?.role || null,
        metadata: metadata ? metadata as Prisma.InputJsonValue : undefined,
        oldValue: oldValue ? oldValue as Prisma.InputJsonValue : undefined,
        newValue: newValue ? newValue as Prisma.InputJsonValue : undefined,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        description: finalDescription
      }
    })
  } catch (error) {
    console.error('[Audit] Failed to log event:', error)
  }
}

// ============================================
// USER AUDIT LOGS
// ============================================

export async function logUserCreated(userId: string, createdByUserId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: userId,
    userId: createdByUserId,
    metadata
  })
}

export async function logUserUpdated(userId: string, updatedByUserId: string, oldValue?: Record<string, unknown>, newValue?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: userId,
    userId: updatedByUserId,
    oldValue,
    newValue
  })
}

export async function logUserDeleted(userId: string, deletedByUserId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'USER_DELETED',
    entityType: 'User',
    entityId: userId,
    userId: deletedByUserId,
    metadata
  })
}

export async function logUserRoleChanged(userId: string, changedByUserId: string, oldRole: string, newRole: string) {
  return logAuditEvent({
    action: 'USER_ROLE_CHANGED',
    entityType: 'User',
    entityId: userId,
    userId: changedByUserId,
    oldValue: { role: oldRole },
    newValue: { role: newRole }
  })
}

export async function logUserLogin(userId: string, ipAddress?: string, userAgent?: string) {
  return logAuditEvent({
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: userId,
    userId,
    ipAddress,
    userAgent
  })
}

export async function logUserLogout(userId: string, ipAddress?: string, userAgent?: string) {
  return logAuditEvent({
    action: 'USER_LOGOUT',
    entityType: 'User',
    entityId: userId,
    userId,
    ipAddress,
    userAgent
  })
}

export async function logUserPasswordChanged(userId: string, changedByUserId: string) {
  return logAuditEvent({
    action: 'USER_PASSWORD_CHANGED',
    entityType: 'User',
    entityId: userId,
    userId: changedByUserId
  })
}

// ============================================
// PROJECT AUDIT LOGS
// ============================================

export async function logProjectCreated(projectId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'PROJECT_CREATED',
    entityType: 'Project',
    entityId: projectId,
    userId,
    metadata
  })
}

export async function logProjectUpdated(projectId: string, userId: string, oldValue?: Record<string, unknown>, newValue?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'PROJECT_UPDATED',
    entityType: 'Project',
    entityId: projectId,
    userId,
    oldValue,
    newValue
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

// ============================================
// ALBUM AUDIT LOGS
// ============================================

export async function logAlbumCreated(albumId: string, userId: string, projectId: string | null, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'ALBUM_CREATED',
    entityType: 'Album',
    entityId: albumId,
    userId,
    metadata: { ...metadata, projectId }
  })
}

export async function logAlbumUpdated(albumId: string, userId: string, oldValue?: Record<string, unknown>, newValue?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'ALBUM_UPDATED',
    entityType: 'Album',
    entityId: albumId,
    userId,
    oldValue,
    newValue
  })
}

export async function logAlbumDeleted(albumId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'ALBUM_DELETED',
    entityType: 'Album',
    entityId: albumId,
    userId,
    metadata
  })
}

export async function logAlbumImageAdded(albumId: string, imageIds: string[], userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'ALBUM_IMAGE_ADDED',
    entityType: 'Album',
    entityId: albumId,
    userId,
    metadata: { ...metadata, imageIds, count: imageIds.length }
  })
}

export async function logAlbumImageRemoved(albumId: string, imageIds: string[], userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'ALBUM_IMAGE_REMOVED',
    entityType: 'Album',
    entityId: albumId,
    userId,
    metadata: { ...metadata, imageIds, count: imageIds.length }
  })
}

export async function logAlbumSettingsChanged(albumId: string, userId: string, oldValue?: Record<string, unknown>, newValue?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'ALBUM_SETTINGS_CHANGED',
    entityType: 'Album',
    entityId: albumId,
    userId,
    oldValue,
    newValue
  })
}

// ============================================
// IMAGE AUDIT LOGS
// ============================================

export async function logImageUploaded(imageId: string, userId: string, projectId: string | null, albumId: string | null) {
  return logAuditEvent({
    action: 'IMAGE_UPLOADED',
    entityType: 'Image',
    entityId: imageId,
    userId,
    metadata: { projectId, albumId }
  })
}

export async function logImageDeleted(imageId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'IMAGE_DELETED',
    entityType: 'Image',
    entityId: imageId,
    userId,
    metadata
  })
}

export async function logImageMoved(imageId: string, userId: string, fromLocation: string, toLocation: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'IMAGE_MOVED',
    entityType: 'Image',
    entityId: imageId,
    userId,
    metadata: { ...metadata, fromLocation, toLocation }
  })
}

export async function logImageCopied(imageId: string, userId: string, toLocation: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'IMAGE_COPIED',
    entityType: 'Image',
    entityId: imageId,
    userId,
    metadata: { ...metadata, toLocation }
  })
}

export async function logImageCloned(imageIds: string[], userId: string, targetUserId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'IMAGE_CLONED',
    entityType: 'Image',
    entityId: imageIds.join(','),
    userId,
    metadata: { ...metadata, imageIds, count: imageIds.length, targetUserId }
  })
}

// ============================================
// JOB AUDIT LOGS
// ============================================

export async function logJobCreated(jobId: string, userId: string, jobType: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'JOB_CREATED',
    entityType: 'Job',
    entityId: jobId,
    userId,
    metadata: { ...metadata, jobType }
  })
}

export async function logJobStarted(jobId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'JOB_STARTED',
    entityType: 'Job',
    entityId: jobId,
    userId,
    metadata
  })
}

export async function logJobCompleted(jobId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'JOB_COMPLETED',
    entityType: 'Job',
    entityId: jobId,
    userId,
    metadata
  })
}

export async function logJobFailed(jobId: string, userId: string, error?: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'JOB_FAILED',
    entityType: 'Job',
    entityId: jobId,
    userId,
    metadata: { ...metadata, error }
  })
}

export async function logJobRetry(jobId: string, userId: string, attempt: number, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'JOB_RETRY',
    entityType: 'Job',
    entityId: jobId,
    userId,
    metadata: { ...metadata, attempt }
  })
}

export async function logJobCancelled(jobId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'JOB_CANCELLED',
    entityType: 'Job',
    entityId: jobId,
    userId,
    metadata
  })
}

export async function logJobForceRun(jobId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'JOB_FORCE_RUN',
    entityType: 'Job',
    entityId: jobId,
    userId,
    metadata
  })
}

// ============================================
// CLIENT ACCESS AUDIT LOGS
// ============================================

export async function logClientAccessGranted(projectId: string, clientUserId: string, accessLevel: string, grantedByUserId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'CLIENT_ACCESS_GRANTED',
    entityType: 'Project',
    entityId: projectId,
    userId: grantedByUserId,
    metadata: { ...metadata, clientUserId, accessLevel }
  })
}

export async function logClientAccessRevoked(projectId: string, clientUserId: string, revokedByUserId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'CLIENT_ACCESS_REVOKED',
    entityType: 'Project',
    entityId: projectId,
    userId: revokedByUserId,
    metadata: { ...metadata, clientUserId }
  })
}

export async function logClientAccessModified(projectId: string, clientUserId: string, oldLevel: string, newLevel: string, modifiedByUserId: string) {
  return logAuditEvent({
    action: 'CLIENT_ACCESS_MODIFIED',
    entityType: 'Project',
    entityId: projectId,
    userId: modifiedByUserId,
    oldValue: { accessLevel: oldLevel },
    newValue: { accessLevel: newLevel },
    metadata: { clientUserId }
  })
}

// ============================================
// SHARE LINK AUDIT LOGS
// ============================================

export async function logShareLinkCreated(shareLinkId: string, userId: string, projectId?: string, albumId?: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'SHARE_LINK_CREATED',
    entityType: 'ShareLink',
    entityId: shareLinkId,
    userId,
    metadata: { ...metadata, projectId, albumId }
  })
}

export async function logShareLinkRevoked(shareLinkId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'SHARE_LINK_REVOKED',
    entityType: 'ShareLink',
    entityId: shareLinkId,
    userId,
    metadata
  })
}

export async function logShareLinkAccessed(shareLinkId: string, ipAddress?: string, userAgent?: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'SHARE_LINK_ACCESSED',
    entityType: 'ShareLink',
    entityId: shareLinkId,
    userId: 'anonymous',
    ipAddress,
    userAgent,
    metadata
  })
}

// ============================================
// SETTINGS AUDIT LOGS
// ============================================

export async function logSettingsChanged(userId: string, settingKey: string, oldValue?: unknown, newValue?: unknown, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'SETTINGS_CHANGED',
    entityType: 'Settings',
    entityId: settingKey,
    userId,
    oldValue: oldValue ? { [settingKey]: oldValue } : undefined,
    newValue: newValue ? { [settingKey]: newValue } : undefined,
    metadata
  })
}

// ============================================
// STORAGE AUDIT LOGS
// ============================================

export async function logStorageQuotaChanged(userId: string, oldQuota: number, newQuota: number, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'STORAGE_QUOTA_CHANGED',
    entityType: 'User',
    entityId: userId,
    userId,
    oldValue: { quotaBytes: oldQuota },
    newValue: { quotaBytes: newQuota },
    metadata
  })
}

export async function logStorageWarning(userId: string, usagePercent: number, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'STORAGE_WARNING',
    entityType: 'User',
    entityId: userId,
    userId,
    metadata: { ...metadata, usagePercent }
  })
}

// ============================================
// ADMIN AUDIT LOGS
// ============================================

export async function logSystemConfigChanged(userId: string, configKey: string, oldValue?: unknown, newValue?: unknown, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'SYSTEM_CONFIG_CHANGED',
    entityType: 'SystemConfig',
    entityId: configKey,
    userId,
    oldValue: oldValue ? { [configKey]: oldValue } : undefined,
    newValue: newValue ? { [configKey]: newValue } : undefined,
    metadata
  })
}

export async function logBulkOperation(userId: string, operation: string, affectedCount: number, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'BULK_OPERATION',
    entityType: 'System',
    entityId: 'bulk',
    userId,
    metadata: { ...metadata, operation, affectedCount }
  })
}

// ============================================
// DOWNLOAD AUDIT LOGS
// ============================================

export async function logImageDownloaded(imageId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'IMAGE_DOWNLOADED',
    entityType: 'Image',
    entityId: imageId,
    userId,
    metadata
  })
}

export async function logAlbumDownloaded(albumId: string, userId: string, imageCount: number, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'ALBUM_DOWNLOADED',
    entityType: 'Album',
    entityId: albumId,
    userId,
    metadata: { ...metadata, imageCount }
  })
}

// ============================================
// PRO REQUEST AUDIT LOGS
// ============================================

export async function logProRequestSubmitted(requestId: string, userId: string, requestType: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'PRO_REQUEST_SUBMITTED',
    entityType: 'ProRequest',
    entityId: requestId,
    userId,
    metadata: { ...metadata, requestType }
  })
}

export async function logProjectExportRequested(projectId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'PROJECT_EXPORT_REQUESTED',
    entityType: 'Project',
    entityId: projectId,
    userId,
    metadata
  })
}

export async function logFaceRecognitionRequested(albumId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'FACE_RECOGNITION_REQUESTED',
    entityType: 'Album',
    entityId: albumId,
    userId,
    metadata
  })
}

export async function logWatermarkRequested(albumId: string, userId: string, metadata?: Record<string, unknown>) {
  return logAuditEvent({
    action: 'WATERMARK_REQUESTED',
    entityType: 'Album',
    entityId: albumId,
    userId,
    metadata
  })
}
