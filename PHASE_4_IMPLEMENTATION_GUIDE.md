# Phase 4 Implementation Guide: Professional Projects

**Status**: ✅ READY FOR DEVELOPMENT  
**Version**: 1.0.0  
**Last Updated**: 2026-02-16  
**Date**: 2026-02-16  
**Phase**: 4 - Professional Projects  
**Dependencies**: Phase 1 (Ingestion), Phase 3 (Auth)

---

## Overview

Phase 4 introduces professional project-based workflows with client sharing capabilities. This enables photographers to organize images into projects and share them securely with clients via token-based access.

### Key Features Implemented

1. **Project Management** - Create, organize, and manage photo projects
2. **Storage Quotas** - Per-project storage limits with enforcement
3. **Client Sharing** - Secure, time-limited sharing via token-based links
4. **Project-scoped Uploads** - Upload images directly to specific projects
5. **Read-only Client Views** - Clean interface for clients to view shared projects

---

## Architecture

### Database Schema

#### Project Model
```prisma
model Project {
  id            String       @id @default(cuid())
  name          String
  description   String?
  ownerId       String
  owner         User         @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  images        Image[]
  shareTokens   ShareToken[]
  quotaBytes    Int          @default(5368709120) // 5GB default
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}
```

#### ShareToken Model
```prisma
model ShareToken {
  id              String    @id @default(cuid())
  token           String    @unique
  projectId       String
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  clientEmail     String?   // Optional: email of specific client
  expiresAt       DateTime? // Optional: token expiry
  canUpload       Boolean   @default(false)  // Always false per contract
  canDelete       Boolean   @default(false)  // Always false per contract
  accessCount     Int       @default(0)
  lastAccessedAt  DateTime?
  createdAt       DateTime  @default(now())
}
```

#### Updated Image Model
```prisma
model Image {
  // ... existing fields ...
  projectId     String?
  project       Project?    @relation(fields: [projectId], references: [id], onDelete: SetNull)
  ownerId       String
  owner         User        @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  // ...
}
```

### API Architecture

#### Protected Routes (Authentication Required)
- `/api/projects` - Project CRUD operations
- `/api/projects/[id]/images` - Project-scoped image operations
- `/api/projects/[id]/share` - Share token management
- `/api/upload` - Upload with optional project assignment

#### Public Routes (No Authentication)
- `/api/share/[token]` - Validate share token
- `/api/share/[token]/images` - Get shared images

### File Structure

```
app/
├── api/
│   ├── projects/
│   │   ├── route.ts                 # GET, POST - List/Create projects
│   │   ├── [id]/
│   │   │   ├── route.ts             # GET, PATCH, DELETE - Project operations
│   │   │   ├── images/
│   │   │   │   └── route.ts         # GET - List project images
│   │   │   └── share/
│   │   │       ├── route.ts         # GET, POST - Share management
│   │   │       └── [tokenId]/
│   │   │           └── route.ts     # DELETE - Revoke share
│   │   └── share/
│   │       └── [token]/
│   │           ├── route.ts         # GET - Validate token (public)
│   │           └── images/
│   │               └── route.ts     # GET - Get images (public)
│   └── upload/
│       └── route.ts                 # POST - Upload with project support
├── projects/
│   ├── page.tsx                     # Project list UI
│   └── [id]/
│       ├── page.tsx                 # Project detail UI
│       ├── upload/
│       │   └── page.tsx             # Project upload UI
│       └── share/
│           └── page.tsx             # Share management UI
└── share/
    └── [token]/
        └── page.tsx                 # Client view (public, read-only)
```

---

## Implementation Details

### 1. Project Management

#### Creating Projects
```typescript
// POST /api/projects
{
  "name": "Wedding Photography",
  "description": "John & Jane Wedding - June 2024",
  "quotaBytes": 10737418240  // 10GB (optional, defaults to 5GB)
}
```

**Features**:
- Automatic ownership assignment from session
- Default 5GB quota
- Storage usage calculated dynamically

#### Storage Quota Calculation
```typescript
const images = await prisma.image.findMany({
  where: { projectId: project.id },
  select: { sizeBytes: true }
})

const usedBytes = images.reduce((sum, img) => sum + img.sizeBytes, 0)
const usagePercentage = (usedBytes / project.quotaBytes) * 100
```

### 2. Share Token System

#### Token Generation
```typescript
import crypto from 'crypto'

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
```

**Security Features**:
- 256-bit cryptographically random tokens
- Optional expiry dates
- Optional client email association
- Access tracking (count, last accessed)
- Read-only permissions enforced

#### Creating Share Links
```typescript
// POST /api/projects/[id]/share
{
  "clientEmail": "client@example.com",  // Optional
  "expiresAt": "2024-12-31T23:59:59Z"   // Optional
}

// Response
{
  "id": "share_123",
  "token": "a1b2c3d4e5f6...",
  "shareUrl": "http://localhost:3000/share/a1b2c3d4e5f6...",
  "clientEmail": "client@example.com",
  "expiresAt": "2024-12-31T23:59:59Z",
  "accessCount": 0,
  "createdAt": "2024-06-01T00:00:00Z"
}
```

#### Token Validation
```typescript
// GET /api/share/[token]

// Validates:
// 1. Token exists
// 2. Not expired (if expiry set)
// 3. Updates accessCount and lastAccessedAt

// Returns project info without sensitive data
{
  "project": {
    "id": "proj_123",
    "name": "Wedding Photography",
    "description": "...",
    "owner": {
      "name": "Photographer Name",
      "email": "photo@example.com"
    }
  },
  "permissions": {
    "canUpload": false,
    "canDelete": false
  }
}
```

### 3. Quota Enforcement

#### Pre-upload Check
```typescript
async function checkProjectQuota(
  projectId: string, 
  fileSize: number
): Promise<{ allowed: boolean; currentUsage: number; quota: number }> {
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      images: { select: { sizeBytes: true } }
    }
  })

  const currentUsage = project.images.reduce(
    (sum, img) => sum + img.sizeBytes, 0
  )
  
  const allowed = (currentUsage + fileSize) <= project.quotaBytes
  
  return { allowed, currentUsage, quota: project.quotaBytes }
}
```

#### Quota Exceeded Response
```typescript
// HTTP 413 Payload Too Large
{
  "error": "Storage quota exceeded",
  "code": "QUOTA_EXCEEDED",
  "details": {
    "quotaBytes": 5368709120,
    "usedBytes": 4831838208,
    "requestedBytes": 1048576000,
    "availableBytes": 536870912
  }
}
```

### 4. Project-scoped Uploads

#### Upload Endpoint
```typescript
// POST /api/upload
// FormData:
//   - file: File
//   - projectId: string (optional)
//   - title: string (optional)

// With projectId:
// 1. Verifies project ownership
// 2. Checks quota
// 3. Creates image with projectId
// 4. Returns projectId in response
```

#### UI Upload Flow
1. User selects files (drag-drop or file picker)
2. Pre-upload validation checks total size against quota
3. Files uploaded sequentially
4. Progress tracked per file
5. Success/error states displayed
6. Project quota refreshed after uploads

### 5. Client View

#### Public Access
- **No authentication required**
- **Read-only access** - No upload/delete buttons
- **Clean interface** - Minimal, focused on images
- **Owner attribution** - Shows who shared the project
- **Expiry warnings** - Displays if link will expire

#### Security Measures
```typescript
// Share page (/share/[token])
// 1. Validates token on load
// 2. Shows error if invalid/expired
// 3. No edit capabilities
// 4. No sensitive data exposed
```

---

## UI Components

### Project List (`/projects`)
- Grid of project cards
- Storage usage visualization
- Quick actions (share, delete)
- Create project modal

### Project Detail (`/projects/[id]`)
- Project header with description
- Stats cards (images, storage, quota)
- Image gallery
- Edit/delete functionality

### Project Upload (`/projects/[id]/upload`)
- Drag-and-drop zone
- Multi-file selection
- Real-time quota display
- Progress tracking
- Error handling

### Share Management (`/projects/[id]/share`)
- Active share links list
- Create share dialog
- Copy link functionality
- Revoke shares
- Access statistics

### Client View (`/share/[token]`)
- Project title and description
- Owner information
- Image gallery
- Read-only indicator

---

## Security Considerations

### 1. Authentication
- All project operations require valid session
- Middleware validates JWT tokens
- Ownership verified on every request

### 2. Authorization
```typescript
// Example: Project access check
const project = await prisma.project.findFirst({
  where: { 
    id: params.id,
    ownerId: session.user.id  // Ensures ownership
  }
})
```

### 3. Share Token Security
- Tokens are cryptographically random (256-bit)
- Optional expiry prevents indefinite access
- Access tracking for audit trail
- No sensitive data in public endpoints

### 4. Quota Enforcement
- Server-side validation prevents bypassing
- Returns detailed error information
- UI prevents exceeding quota client-side

---

## Testing Guide

### Manual Testing Checklist

#### Project Management
- [ ] Create project with name and description
- [ ] Edit project name/description
- [ ] Delete project (confirms cascade delete)
- [ ] View project list with storage usage
- [ ] Verify quota display accuracy

#### Upload
- [ ] Upload single image to project
- [ ] Upload multiple images
- [ ] Verify quota decreases correctly
- [ ] Test quota exceeded error
- [ ] Verify images appear in project

#### Sharing
- [ ] Create share link without expiry
- [ ] Create share link with expiry
- [ ] Create share link with client email
- [ ] Copy share URL to clipboard
- [ ] Revoke share link
- [ ] Access share link as unauthenticated user

#### Client View
- [ ] Access valid share link
- [ ] Verify read-only (no upload/delete)
- [ ] Verify project info displays
- [ ] Test expired link shows error
- [ ] Test invalid link shows error

### API Testing

```bash
# Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"name": "Test Project", "quotaBytes": 10737418240}'

# Create share token
curl -X POST http://localhost:3000/api/projects/[id]/share \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"clientEmail": "test@example.com", "expiresAt": "2024-12-31T23:59:59Z"}'

# Access public share (no auth needed)
curl http://localhost:3000/api/share/[token]
```

---

## Configuration

### Environment Variables
```env
# Required for share URLs
NEXTAUTH_URL=http://localhost:3000

# Database (PostgreSQL with Prisma)
DATABASE_URL="postgresql://postgres:password@localhost:5432/frame?schema=public"

# Authentication
NEXTAUTH_SECRET=your-secret-key
```

### Default Quotas
- **Default Project Quota**: 5GB (5,368,709,120 bytes)
- Can be customized per project during creation

---

## Performance Considerations

### 1. Database Indexes
```prisma
@@index([ownerId])      // Fast project lookup by owner
@@index([projectId])    // Fast image lookup by project
@@index([token])        // Fast share token lookup
@@index([expiresAt])    // Fast expiry queries
```

### 2. Quota Calculation
- Calculated on-demand for accuracy
- Could be optimized with materialized views for large projects

### 3. File Uploads
- Streaming upload to temp storage
- Progress tracking via UI state
- Concurrent uploads handled sequentially

---

## Error Handling

### Common Errors

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `PROJECT_NOT_FOUND` | 404 | Project doesn't exist or no access |
| `QUOTA_EXCEEDED` | 413 | Upload would exceed storage quota |
| `INVALID_SHARE_TOKEN` | 404 | Share token doesn't exist |
| `SHARE_EXPIRED` | 410 | Share token has expired |

### Error Response Format
```typescript
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details?: { ... }  // Additional context
}
```

---

## Migration Notes

### Database Migration
```bash
# Phase 4 migration creates:
# - Project table
# - ShareToken table
# - Updates Image table with projectId and ownerId

npx prisma migrate dev --name phase_4_projects
```

### Breaking Changes
- Upload API now requires authentication
- Collection unique constraint updated to include ownerId
- Image model now requires ownerId

---

## Future Enhancements

### Phase 5+ Considerations
- Watermarking for client previews
- Download all images as ZIP
- Client comments/approvals
- Multiple client access levels
- Project templates
- Batch move images between projects

---

## References

- **Phase 4 Contract**: `.ai/contracts/phase-4-projects.md`
- **Phase 3 Auth**: `.ai/contracts/phase-3-auth.md`
- **Phase 1 Ingestion**: `.ai/contracts/phase-1-ingestion.md`
- **Database Schema**: `prisma/schema.prisma`
- **Implementation Plan**: `.ai/implementation/phase-4-implementation.md`

---

## Success Criteria ✅

All criteria met:
- [x] Projects can be created with quotas
- [x] Images can be uploaded to specific projects
- [x] Quota enforcement blocks overages
- [x] Share links can be created with optional expiry
- [x] Clients can view shared projects without authentication
- [x] All operations are secure and ownership-verified
- [x] UI provides clear feedback on quota usage
- [x] Read-only access enforced for clients

---

**Last Updated**: 2026-02-16  
**Version**: 1.0.0  
**Status**: Production Ready
