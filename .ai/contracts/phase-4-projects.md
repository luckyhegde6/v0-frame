# Phase 4 — Professional Projects & PRO Features Contracts

**Status**: COMPLETED  
**Version**: 2.1.0  
**Phase**: 4 – Projects & PRO Features  
**Last Updated**: 2026-02-20  

---

## Scope

### ✅ Covers
- Projects with enhanced details (event name, start date, branding, cover image)
- Project-scoped uploads
- Client sharing with QR codes
- Storage quotas
- PRO Profile management
- Album Settings
- Client Access Management
- Audit Logging
- Share Service Popup

### ❌ Excludes
- ❌ Billing/Subscriptions
- ❌ Analytics Dashboard
- ❌ Email Notifications (future phase)

---

## PRO Profile Contract

### Database Schema

```prisma
model ProProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  businessName    String?
  logo            String?
  location        String?
  phone           String?
  email           String?
  website         String?
  bio             String?
  facebook        String?
  instagram       String?
  twitter         String?
  linkedin        String?
  portfolioUrl    String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Access Control
- Only PRO users can have profiles
- Profile editable by: PRO user (own profile), ADMIN, SUPERADMIN
- Profile visible to: Public (business info), Authenticated users (full)

### API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/profile` | Get PRO profile | PRO, ADMIN, SUPERADMIN |
| PATCH | `/api/profile` | Update PRO profile | PRO (own), ADMIN, SUPERADMIN |
| POST | `/api/profile/logo` | Upload logo | PRO (own), ADMIN, SUPERADMIN |

---

## Enhanced Project Contract

### Database Schema

```prisma
model Project {
  id             String   @id @default(cuid())
  name           String
  description    String?
  
  // Event/Project details
  eventName      String?
  startDate      DateTime?
  branding       Boolean  @default(false)
  watermarkImage String?
  coverImage     String?
  
  // Storage management
  quotaBytes     BigInt   @default(10737418240)
  storageUsed    BigInt   @default(0)
  
  // Ownership
  ownerId        String
  owner          User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  
  // Relations
  images         ProjectImage[]
  shareTokens    ShareToken[]
  clientAccess   ClientProjectAccess[]
  albums         Album[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([name, ownerId])
  @@index([ownerId])
}
```

### Project Creation Flow
1. User creates project with name, description, event details
2. Optional: Set start date, branding toggle, cover image
3. On success: Show share service popup with QR code generation
4. User can generate share links from popup

### Share Service Popup
- Display after project creation
- Show QR code for share URL
- Shareable URL with copy button
- Option to add client email
- Download QR code button

---

## Album Settings Contract

### Database Schema

```prisma
// Quality Enums
enum ImageQuality {
  LOW     // 1920px
  MEDIUM  // 2560px
  HIGH    // 4000px
  ORIGINAL
}

enum VideoQuality {
  LOW     // 720p
  MEDIUM  // 1080p
  HIGH    // 4K
}

enum ShortQuality {
  LOW     // 720p
  MEDIUM  // 1080p
  HIGH    // 1440p
}

enum WatermarkPosition {
  TOP_LEFT
  TOP_RIGHT
  BOTTOM_LEFT
  BOTTOM_RIGHT
  CENTER
}

enum FaceRecStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  DISABLED
}

model AlbumSettings {
  id              String           @id @default(cuid())
  albumId         String           @unique
  album           Album            @relation(fields: [albumId], references: [id], onDelete: Cascade)
  
  // Upload preferences
  imageQuality    ImageQuality     @default(HIGH)
  videoQuality   VideoQuality     @default(HIGH)
  shortQuality   ShortQuality     @default(HIGH)
  
  // Resolution settings
  maxImageWidth  Int              @default(4000)
  maxImageHeight Int              @default(4000)
  
  // Watermark
  watermarkEnabled Boolean         @default(false)
  watermarkImage  String?
  watermarkOpacity Float          @default(0.5)
  watermarkPosition WatermarkPosition @default(BOTTOM_RIGHT)
  
  // Features
  faceRecognitionEnabled Boolean   @default(false)
  faceRecognitionStatus FaceRecStatus @default(PENDING)
  
  // Download
  downloadEnabled  Boolean         @default(true)
  bulkDownloadEnabled Boolean     @default(true)
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}
```

### Access Control
- Settings editable by: Album owner, Project owner, ADMIN, SUPERADMIN
- Face recognition toggle creates AdminTask

### API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/albums/:id/settings` | Get album settings | Owner, Project Owner, ADMIN, SUPERADMIN |
| PATCH | `/api/albums/:id/settings` | Update settings | Owner, Project Owner, ADMIN, SUPERADMIN |
| POST | `/api/albums/:id/settings/face-recognition` | Request face rec | Owner, Project Owner, ADMIN, SUPERADMIN |

### Quality Presets
| Quality | Image Width | Video Resolution | Shorts Resolution |
|---------|------------|------------------|-------------------|
| LOW     | 1920px     | 720p             | 720p              |
| MEDIUM  | 2560px     | 1080p            | 1080p             |
| HIGH    | 4000px     | 4K               | 1440p             |
| ORIGINAL| Original   | Original         | Original          |

---

## Client Access Management Contract

### Database Schema

```prisma
enum AccessLevel {
  READ    // View only
  WRITE   // View and upload
  FULL    // Full control including delete
}

// Client Project Access
model ClientProjectAccess {
  id          String        @id @default(cuid())
  projectId   String
  project     Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId      String
  user        User          @relation("UserRelation", fields: [userId], references: [id], onDelete: Cascade)
  accessLevel AccessLevel   @default(READ)
  
  grantedById String
  grantedBy   User          @relation("GrantedByRelation", fields: [grantedById], references: [id], onDelete: Cascade)
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
}

// Client Album Access
model ClientAlbumAccess {
  id          String        @id @default(cuid())
  albumId     String
  album       Album         @relation(fields: [albumId], references: [id], onDelete: Cascade)
  userId      String
  user        User          @relation("UserRelation", fields: [userId], references: [id], onDelete: Cascade)
  accessLevel AccessLevel   @default(READ)
  
  grantedById String
  grantedBy   User          @relation("GrantedByAlbumRelation", fields: [grantedById], references: [id], onDelete: Cascade)
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([albumId, userId])
  @@index([albumId])
  @@index([userId])
}
```

### Access Control
- PRO can grant Read access to any user in the system
- Access granted per project or per album
- Grantor must be project owner or ADMIN/SUPERADMIN
- Revocation immediate and complete

### API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/projects/:id/clients` | List clients with access | Project Owner, ADMIN, SUPERADMIN |
| POST | `/api/projects/:id/clients` | Grant client access | Project Owner, ADMIN, SUPERADMIN |
| DELETE | `/api/projects/:id/clients/:userId` | Revoke access | Project Owner, ADMIN, SUPERADMIN |
| GET | `/api/albums/:id/clients` | List album clients | Album Owner, ADMIN, SUPERADMIN |
| POST | `/api/albums/:id/clients` | Grant album access | Album Owner, ADMIN, SUPERADMIN |
| DELETE | `/api/albums/:id/clients/:userId` | Revoke album access | Album Owner, ADMIN, SUPERADMIN |

---

## Audit Logging Contract

### Database Schema

```prisma
enum AuditAction {
  // User actions
  USER_CREATED
  USER_UPDATED
  USER_DELETED
  USER_LOGIN
  USER_LOGOUT
  
  // Project actions
  PROJECT_CREATED
  PROJECT_UPDATED
  PROJECT_DELETED
  
  // Album actions
  ALBUM_CREATED
  ALBUM_UPDATED
  ALBUM_DELETED
  
  // Share actions
  SHARE_LINK_CREATED
  SHARE_LINK_REVOKED
  SHARE_LINK_ACCESSED
  
  // Job actions
  JOB_CREATED
  JOB_STARTED
  JOB_COMPLETED
  JOB_FAILED
  
  // Storage actions
  STORAGE_USAGE_CHANGED
  QUOTA_EXCEEDED
  
  // Access actions
  ACCESS_GRANTED
  ACCESS_REVOKED
  ACCESS_MODIFIED
  
  // Settings actions
  SETTINGS_UPDATED
}

model AuditLog {
  id          String      @id @default(cuid())
  action      AuditAction
  entityType  String
  entityId    String?
  
  // Changes
  oldValue    Json?
  newValue    Json?
  
  // User info
  userId      String?
  userEmail   String?
  userName    String?
  userRole    Role?
  
  // Metadata
  ipAddress   String?
  userAgent   String?
  description String?
  
  createdAt   DateTime    @default(now())

  @@index([action])
  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
}
```

### Access Control
- Only ADMIN and SUPERADMIN can view audit logs
- Logs are immutable (append-only)
- Retention: 90 days (configurable)

### API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/audit` | List audit logs | ADMIN, SUPERADMIN |
| GET | `/api/audit/export` | Export logs | ADMIN, SUPERADMIN |

### Query Parameters
- `action`: Filter by action type
- `userId`: Filter by user
- `entityType`: Filter by entity type
- `entityId`: Filter by entity ID
- `from`: Start date
- `to`: End date
- `page`: Page number
- `limit`: Items per page (default 100)

---

## Client Sharing Contract

### Share Token Flow
1. Owner generates share token via UI
2. Token created with optional expiry and max accesses
3. Client receives share link: `/share/{token}`
4. QR code generated for share URL
5. Client can view project images (read-only)
6. Token access is logged in AuditLog

### Share Service Popup
- Display after project creation
- Generate shareable URL
- Display QR code
- Copy link functionality
- Download QR code
- Optional: Add client email

### Access Control
- Read-only access enforced
- No upload capability
- No delete capability
- Token expiry enforced
- Max access limit enforced

---

## Storage Quota Contract

- Default quota: 10GB per project
- quotaBytes: Total storage allowed
- storageUsed: Current bytes used (BigInt)
- Calculated from all images in project
- API prevents upload when quota exceeded
- AuditLog entry on quota exceeded

---

## Project Isolation Contract

### Filesystem

```
/users/{userId}/projects/{projectId}/
```

### Rules
- Users can only access own projects
- Cross-project access forbidden
- Project deletion cascades to albums and access
- Client access strictly controlled

---

## Agent Rejection Criteria

- Cross-project access attempts
- Client uploads to shared projects
- Unauthorized profile access
- Audit log access by non-admin
- Exceeding quota without warning
- Face recognition without admin task creation
- Modifying audit logs
- Granting access to non-existent users

---

## Filesystem Structure

```
app/
├── api/
│   ├── profile/
│   │   ├── route.ts           # GET, PATCH
│   │   └── logo/
│   │       └── route.ts       # POST
│   ├── projects/
│   │   ├── [id]/
│   │   │   ├── clients/
│   │   │   │   └── [userId]/
│   │   │   │       └── route.ts   # DELETE
│   │   │   └── route.ts       # GET, PATCH, DELETE
│   │   └── route.ts           # GET, POST
│   ├── albums/
│   │   └── [id]/
│   │       └── settings/
│   │           ├── route.ts   # GET, PATCH
│   │           └── face-recognition/
│   │               └── route.ts   # POST
│   └── audit/
│       ├── route.ts           # GET
│       └── export/
│           └── route.ts       # GET
├── profile/
│   └── page.tsx               # PRO profile page
├── admin/
│   └── audit/
│       └── page.tsx           # Audit logs page
└── share/
    └── [token]/
        └── page.tsx           # Client view
```

---

**Last Updated**: 2026-02-20  
**Version**: 2.1.0  
**Status**: COMPLETED

## Implementation Notes

### Known LSP Issues (Non-blocking)
Some TypeScript LSP errors may appear in IDE for Prisma types (e.g., `storageType`, `albumId`, `albumImages`, `_count`). These are false positives caused by Prisma client type generation timing. The build passes successfully and all functionality works correctly.

To resolve LSP issues:
1. Run `pnpm db:generate` to regenerate Prisma client
2. Restart TypeScript server in IDE
3. If persists, delete `node_modules/.prisma` and regenerate
