# Audit Actions Reference

**Version**: 1.0.0  
**Last Updated**: 2026-02-19

---

## Overview

This document defines all audit actions tracked in the FRAME system. Each action represents a Create, Delete, or Update (CDC) operation that is logged for security, compliance, and debugging purposes.

---

## Audit Action Categories

### 1. User Actions

| Action | Entity | Description | Metadata |
|--------|--------|-------------|----------|
| `USER_CREATED` | User | Admin created a new user account | `email`, `role` |
| `USER_UPDATED` | User | User profile updated (name, email) | `oldValue`, `newValue` |
| `USER_DELETED` | User | User account deleted | `email`, `name` |
| `USER_ROLE_CHANGED` | User | User role changed (USER, CLIENT, PRO, ADMIN, SUPERADMIN) | `oldValue.role`, `newValue.role` |
| `USER_LOGIN` | User | User logged into the system | `ipAddress`, `userAgent` |
| `USER_LOGOUT` | User | User logged out | `ipAddress`, `userAgent` |
| `USER_PASSWORD_CHANGED` | User | User changed their password | - |

**Entity Type**: `User`

---

### 2. Project Actions

| Action | Entity | Description | Metadata |
|--------|--------|-------------|----------|
| `PROJECT_CREATED` | Project | New project created | `name`, `eventName` |
| `PROJECT_UPDATED` | Project | Project details updated (name, description, quota) | `oldValue`, `newValue` |
| `PROJECT_DELETED` | Project | Project deleted | `name` |

**Entity Type**: `Project`

---

### 3. Album Actions

| Action | Entity | Description | Metadata |
|--------|--------|-------------|----------|
| `ALBUM_CREATED` | Album | New album created | `name`, `category`, `projectId` |
| `ALBUM_UPDATED` | Album | Album details updated | `oldValue`, `newValue` |
| `ALBUM_DELETED` | Album | Album deleted | `name`, `projectId` |
| `ALBUM_IMAGE_ADDED` | Album | Images added to album | `imageIds`, `count`, `albumName` |
| `ALBUM_IMAGE_REMOVED` | Album | Images removed from album | `imageIds`, `count`, `albumName` |

**Entity Type**: `Album`

---

### 4. Image Actions

| Action | Entity | Description | Metadata |
|--------|--------|-------------|----------|
| `IMAGE_UPLOADED` | Image | New image uploaded | `projectId`, `albumId` |
| `IMAGE_DELETED` | Image | Image deleted from system | - |
| `IMAGE_MOVED` | Image | Image moved between locations | `fromLocation`, `toLocation` |
| `IMAGE_COPIED` | Image | Image copied to another location | `toLocation`, `newImageId` |
| `IMAGE_CLONED` | Image | Image cloned (admin feature) | `imageIds`, `count`, `targetUserId` |

**Entity Type**: `Image`

**Location Formats**:
- User gallery: `user/{userId}`
- Project: `project/{projectId}`
- Album: `project/{projectId}/albums/{albumId}`

---

### 5. Job Actions

| Action | Entity | Description | Metadata |
|--------|--------|-------------|----------|
| `JOB_CREATED` | Job | Background job created | `jobType` |
| `JOB_STARTED` | Job | Job started processing | - |
| `JOB_COMPLETED` | Job | Job completed successfully | - |
| `JOB_FAILED` | Job | Job failed | `error` |

**Entity Type**: `Job`

**Job Types**:
- `OFFLOAD_ORIGINAL` - Move uploaded file to permanent storage
- `THUMBNAIL_GENERATION` - Create thumbnail images
- `PREVIEW_GENERATION` - Create preview images
- `IMAGE_PROCESSING` - Apply processing (compression, watermark, etc.)
- `FACE_RECOGNITION` - Detect faces in images

---

### 6. Client Access Actions

| Action | Entity | Description | Metadata |
|--------|--------|-------------|----------|
| `CLIENT_ACCESS_GRANTED` | Project | Client access to project granted | `clientUserId`, `accessLevel`, `projectName` |
| `CLIENT_ACCESS_REVOKED` | Project | Client access revoked | `clientUserId`, `projectName` |
| `CLIENT_ACCESS_MODIFIED` | Project | Client access level changed | `clientUserId`, `oldValue.accessLevel`, `newValue.accessLevel` |

**Entity Type**: `Project`

**Access Levels**:
- `READ` - View-only access
- `WRITE` - Can upload and manage content
- `FULL` - Full control including settings

---

### 7. Share Link Actions

| Action | Entity | Description | Metadata |
|--------|--------|-------------|----------|
| `SHARE_LINK_CREATED` | ShareLink | Share link generated | `projectId`, `albumId` |
| `SHARE_LINK_REVOKED` | ShareLink | Share link revoked/disabled | - |
| `SHARE_LINK_ACCESSED` | ShareLink | Share link accessed (external) | `ipAddress`, `userAgent` |

**Entity Type**: `ShareLink`

---

### 8. Settings Actions

| Action | Entity | Description | Metadata |
|--------|--------|-------------|----------|
| `SETTINGS_CHANGED` | Settings | User or system settings changed | `oldValue`, `newValue` |
| `ALBUM_SETTINGS_CHANGED` | Album | Album-specific settings changed | `oldValue`, `newValue` |

**Entity Types**: `Settings`, `Album`

---

### 9. Storage Actions

| Action | Entity | Description | Metadata |
|--------|--------|-------------|----------|
| `STORAGE_QUOTA_CHANGED` | User | Storage quota updated | `oldValue.quotaBytes`, `newValue.quotaBytes` |
| `STORAGE_WARNING` | User | Storage usage warning triggered | `usagePercent` |

**Entity Type**: `User`

---

### 10. Admin Actions

| Action | Entity | Description | Metadata |
|--------|--------|-------------|----------|
| `SYSTEM_CONFIG_CHANGED` | SystemConfig | System configuration changed | `oldValue`, `newValue` |
| `BULK_OPERATION` | System | Bulk operation performed | `operation`, `affectedCount`, `targetUserId`, `targetProjectId` |

**Entity Types**: `SystemConfig`, `System`

---

## Audit Log Data Model

```prisma
model AuditLog {
  id          String      @id @default(cuid())
  action      AuditAction
  entityType  String
  entityId    String?
  
  // Changes (for updates)
  oldValue    Json?
  newValue    Json?
  
  // User info
  userId      String?
  user        User?       @relation(fields: [userId], references: [id], onDelete: SetNull)
  userEmail   String?
  userName    String?
  userRole    Role?
  
  // Metadata
  metadata    Json?
  
  // Request info
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime    @default(now())
}
```

---

## Using Audit Functions

### Import

```typescript
import { 
  // User
  logUserCreated,
  logUserUpdated,
  logUserDeleted,
  logUserRoleChanged,
  logUserLogin,
  logUserLogout,
  
  // Project
  logProjectCreated,
  logProjectUpdated,
  logProjectDeleted,
  
  // Album
  logAlbumCreated,
  logAlbumUpdated,
  logAlbumDeleted,
  logAlbumImageAdded,
  logAlbumImageRemoved,
  
  // Image
  logImageUploaded,
  logImageDeleted,
  logImageMoved,
  logImageCopied,
  logImageCloned,
  
  // Job
  logJobCreated,
  logJobStarted,
  logJobCompleted,
  logJobFailed,
  
  // Client Access
  logClientAccessGranted,
  logClientAccessRevoked,
  logClientAccessModified,
  
  // Share Links
  logShareLinkCreated,
  logShareLinkRevoked,
  logShareLinkAccessed,
  
  // Settings
  logSettingsChanged,
  logAlbumSettingsChanged,
  
  // Storage
  logStorageQuotaChanged,
  logStorageWarning,
  
  // Admin
  logSystemConfigChanged,
  logBulkOperation
} from '@/lib/audit'
```

### Examples

```typescript
// Log user creation
await logUserCreated(user.id, adminUser.id, { email: user.email, role: user.role })

// Log project update with before/after values
await logProjectUpdated(
  projectId,
  userId,
  { name: oldName, description: oldDesc },
  { name: newName, description: newDesc }
)

// Log image moved between locations
await logImageMoved(
  imageId,
  userId,
  'user/user123',
  'project/proj456'
)

// Log bulk operation
await logBulkOperation(
  adminUser.id,
  'gallery_move',
  50,
  { targetProjectId: 'proj789' }
)
```

---

## Adding New Audit Actions

When adding a new audit action:

1. **Add to Prisma Enum** (`prisma/schema.prisma`):
   ```prisma
   enum AuditAction {
     // ... existing actions
     NEW_ACTION
   }
   ```

2. **Add TypeScript Type** (`lib/audit.ts`):
   ```typescript
   export type AuditAction =
     | 'NEW_ACTION'
     // ... existing types
   ```

3. **Create Helper Function** (`lib/audit.ts`):
   ```typescript
   export async function logNewAction(
     entityId: string,
     userId: string,
     metadata?: Record<string, unknown>
   ) {
     return logAuditEvent({
       action: 'NEW_ACTION',
       entityType: 'EntityName',
       entityId,
       userId,
       metadata
     })
   }
   ```

4. **Add to Documentation** (this file):
   - Add action to appropriate category table
   - Document metadata fields

---

## Querying Audit Logs

### Via API

```
GET /api/audit?action=PROJECT_DELETED&userId=xxx&startDate=2026-01-01&endDate=2026-02-19
```

### Via Prisma

```typescript
const logs = await prisma.auditLog.findMany({
  where: {
    action: 'ALBUM_IMAGE_REMOVED',
    entityType: 'Album',
    createdAt: {
      gte: new Date('2026-01-01')
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 100
})
```

---

## Retention Policy

Audit logs are retained based on the `oldValue` and `newValue` fields:
- **Create events**: Only `newValue` is populated
- **Update events**: Both `oldValue` and `newValue` are populated
- **Delete events**: Only `oldValue` is populated

Retention period: Configurable per deployment (default: 1 year)
