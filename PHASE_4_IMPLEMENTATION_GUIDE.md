# Phase 4 Implementation Guide: Professional Projects & PRO Features

**Status**: ✅ READY FOR DEVELOPMENT  
**Version**: 2.0.0  
**Last Updated**: 2026-02-18  
**Date**: 2026-02-18  
**Phase**: 4 - Professional Projects  
**Dependencies**: Phase 1 (Ingestion), Phase 3 (Auth)

---

## Overview

Phase 4 introduces professional project-based workflows with client sharing capabilities, PRO profile management, album settings, and comprehensive audit logging.

### Key Features Implemented

1. **PRO Profile Management** - Business profiles with logo, location, contact, social links
2. **Project Management** - Enhanced projects with event details, branding, cover images
3. **Album Settings** - Upload quality, resolution, watermark, face recognition controls
4. **Client Access** - Linked clients with granular permissions
5. **Audit Logging** - Comprehensive activity tracking for admins
6. **QR Code Sharing** - Generate shareable links with QR codes
7. **Service Popup** - Post-project creation popup for generating links

---

## Architecture

### Database Schema

#### PRO Profile Model
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

#### Enhanced Project Model
```prisma
model Project {
  id              String    @id @default(cuid())
  name            String
  description     String?
  eventName       String?
  startDate       DateTime?
  branding        Boolean   @default(false)
  watermarkImage  String?
  coverImage      String?
  
  quotaBytes      BigInt    @default(10737418240)
  storageUsed     BigInt    @default(0)
  
  ownerId         String
  owner           User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  
  images          ProjectImage[]
  shareTokens     ShareToken[]
  accessList      ProjectAccess[]
  clientAccess    ClientProjectAccess[]
  albums          Album[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### Client Access Models
```prisma
model ClientProjectAccess {
  id          String        @id @default(cuid())
  projectId   String
  project     Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessLevel AccessLevel   @default(READ)
  
  grantedById String
  grantedBy   User          @relation(fields: [grantedById], references: [id], onDelete: Cascade)
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model ClientAlbumAccess {
  id          String        @id @default(cuid())
  albumId     String
  album       Album         @relation(fields: [albumId], references: [id], onDelete: Cascade)
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessLevel AccessLevel   @default(READ)
  
  grantedById String
  grantedBy   User          @relation(fields: [grantedById], references: [id], onDelete: Cascade)
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
```

#### Album Settings Model
```prisma
model AlbumSettings {
  id              String           @id @default(cuid())
  albumId         String           @unique
  album           Album            @relation(fields: [albumId], references: [id], onDelete: Cascade)
  
  imageQuality    ImageQuality     @default(HIGH)
  videoQuality   VideoQuality     @default(HIGH)
  shortQuality   ShortQuality     @default(HIGH)
  
  maxImageWidth  Int              @default(4000)
  maxImageHeight Int              @default(4000)
  
  watermarkEnabled Boolean         @default(false)
  watermarkImage  String?
  watermarkOpacity Float           @default(0.5)
  watermarkPosition WatermarkPosition @default(BOTTOM_RIGHT)
  
  faceRecognitionEnabled Boolean   @default(false)
  faceRecognitionStatus FaceRecStatus @default(PENDING)
  
  downloadEnabled  Boolean         @default(true)
  bulkDownloadEnabled Boolean     @default(true)
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}
```

#### Audit Log Model
```prisma
model AuditLog {
  id          String      @id @default(cuid())
  action      AuditAction
  entityType  String
  entityId    String?
  
  oldValue    Json?
  newValue    Json?
  
  userId      String?
  userEmail   String?
  userName    String?
  userRole    Role?
  
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

### Enums
```prisma
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

enum AccessLevel {
  READ
  WRITE
  FULL
}

enum AuditAction {
  USER_CREATED
  USER_UPDATED
  USER_DELETED
  USER_LOGIN
  USER_LOGOUT
  PROJECT_CREATED
  PROJECT_UPDATED
  PROJECT_DELETED
  ALBUM_CREATED
  ALBUM_UPDATED
  ALBUM_DELETED
  SHARE_LINK_CREATED
  SHARE_LINK_REVOKED
  SHARE_LINK_ACCESSED
  JOB_CREATED
  JOB_STARTED
  JOB_COMPLETED
  JOB_FAILED
  STORAGE_USAGE_CHANGED
  QUOTA_EXCEEDED
  ACCESS_GRANTED
  ACCESS_REVOKED
  ACCESS_MODIFIED
  SETTINGS_UPDATED
}
```

---

## Implementation Details

### 1. PRO Profile Management

#### Creating PRO Profile
```typescript
// POST /api/profile
{
  "businessName": "ABC Photography",
  "location": "New York, NY",
  "phone": "+1-555-123-4567",
  "email": "contact@abcphoto.com",
  "website": "https://abcphoto.com",
  "facebook": "https://facebook.com/abcphoto",
  "instagram": "https://instagram.com/abcphoto",
  "twitter": "https://twitter.com/abcphoto",
  "linkedin": "https://linkedin.com/in/abcphoto",
  "portfolioUrl": "https://abcphoto.com/portfolio"
}
```

#### Profile Page Features
- Business name and logo upload
- Location field with address
- Contact details (phone, email)
- Social media links (Facebook, Instagram, Twitter, LinkedIn)
- Portfolio/previous works URL
- Edit/Save functionality

### 2. Project Enhancements

#### Creating Enhanced Project
```typescript
// POST /api/projects
{
  "name": "Wedding Photography",
  "description": "John & Jane Wedding",
  "eventName": "John & Jane Wedding",
  "startDate": "2024-06-15T00:00:00Z",
  "branding": true,
  "watermarkImage": "https://...",
  "coverImage": "https://...",
  "quotaBytes": 10737418240
}
```

#### Project Fields
- **name**: Project display name
- **description**: Project description
- **eventName**: Event/Project name for client display
- **startDate**: Project/event start date
- **branding**: Boolean toggle for enabling watermark/branding
- **watermarkImage**: URL to watermark image
- **coverImage**: URL to project cover image
- **quotaBytes**: Storage quota (default 10GB)

### 3. Share Service Popup

After project creation, show popup with:
- QR code generation for share link
- Shareable URL display
- Copy link button
- Download QR code button
- Social media share options

```typescript
// Generate QR Code
import QRCode from 'qrcode'

const generateQRCode = async (url: string): Promise<string> => {
  return await QRCode.toDataURL(url, {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })
}
```

### 4. Album Settings

#### Settings Page
```typescript
// PATCH /api/albums/[id]/settings
{
  "imageQuality": "HIGH",
  "videoQuality": "HIGH",
  "shortQuality": "HIGH",
  "maxImageWidth": 4000,
  "maxImageHeight": 4000,
  "watermarkEnabled": true,
  "watermarkImage": "https://...",
  "watermarkOpacity": 0.5,
  "watermarkPosition": "BOTTOM_RIGHT",
  "faceRecognitionEnabled": false,
  "downloadEnabled": true,
  "bulkDownloadEnabled": true
}
```

#### Quality Presets
| Quality | Image Width | Video Resolution | Shorts Resolution |
|---------|------------|------------------|-------------------|
| LOW     | 1920px     | 720p             | 720p              |
| MEDIUM  | 2560px     | 1080p            | 1080p             |
| HIGH    | 4000px     | 4K               | 1440p             |
| ORIGINAL| Original   | Original         | Original          |

#### Face Recognition Request
When enabled, creates an AdminTask:
```typescript
// POST /api/albums/[id]/settings/face-recognition
{
  "enabled": true
}

// Creates AdminTask:
{
  "type": "FACE_RECOGNITION",
  "albumId": "album_123",
  "status": "PENDING"
}
```

### 5. Client Access Management

#### Granting Client Access
```typescript
// POST /api/projects/[id]/clients
{
  "userId": "user_client_123",
  "accessLevel": "READ"
}

// Response
{
  "id": "access_456",
  "projectId": "proj_123",
  "userId": "user_client_123",
  "accessLevel": "READ",
  "grantedById": "user_pro_789",
  "createdAt": "2024-06-01T00:00:00Z"
}
```

#### Access Levels
- **READ**: View images only
- **WRITE**: View and upload images
- **FULL**: Full control including delete

#### Revoking Access
```typescript
// DELETE /api/projects/[id]/clients/[userId]
```

### 6. Audit Logging

#### Creating Audit Log Entry
```typescript
// Internal function
async function createAuditLog(
  action: AuditAction,
  entityType: string,
  entityId: string | null,
  user: User | null,
  oldValue?: any,
  newValue?: any,
  description?: string
) {
  return await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId: user?.id,
      userEmail: user?.email,
      userName: user?.name,
      userRole: user?.role,
      oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
      description
    }
  })
}
```

#### Audit Log Queries
```typescript
// GET /api/audit?action=PROJECT_CREATED&userId=user_123&from=2024-01-01&to=2024-12-31
const auditLogs = await prisma.auditLog.findMany({
  where: {
    action: filters.action,
    userId: filters.userId,
    createdAt: {
      gte: filters.from,
      lte: filters.to
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 100,
  skip: paginationOffset
})
```

---

## API Architecture

### Protected Routes (Authentication Required)
- `/api/profile` - PRO profile management
- `/api/projects` - Project CRUD
- `/api/projects/[id]/clients` - Client access
- `/api/albums/[id]/settings` - Album settings
- `/api/audit` - Audit logs (ADMIN/SUPERADMIN only)

### Public Routes (No Authentication)
- `/api/share/[token]` - Validate share token
- `/api/share/[token]/images` - Get shared images

---

## File Structure

```
app/
├── api/
│   ├── profile/
│   │   ├── route.ts           # GET, PATCH - Profile management
│   │   └── logo/
│   │       └── route.ts       # POST - Upload logo
│   ├── projects/
│   │   ├── [id]/
│   │   │   ├── clients/
│   │   │   │   └── [userId]/
│   │   │   │       └── route.ts   # DELETE - Revoke access
│   │   │   └── route.ts       # GET, PATCH, DELETE
│   │   └── route.ts           # GET, POST
│   ├── albums/
│   │   └── [id]/
│   │       └── settings/
│   │           ├── route.ts   # GET, PATCH
│   │           └── face-recognition/
│   │               └── route.ts   # POST - Request face rec
│   ├── audit/
│   │   ├── route.ts           # GET - List logs (admin only)
│   │   └── export/
│   │       └── route.ts       # GET - Export logs
│   └── share/
│       └── [token]/
│           ├── route.ts       # GET - Validate token
│           └── images/
│               └── route.ts   # GET - Get images
├── profile/
│   └── page.tsx               # PRO profile page
├── admin/
│   ├── audit/
│   │   └── page.tsx           # Audit logs page
│   └── page.tsx               # Admin dashboard
└── share/
    └── [token]/
        └── page.tsx           # Client view (public)
```

---

## UI Components

### PRO Profile Page (`/profile`)
- Header with user info
- Business name input
- Logo upload with preview
- Location input
- Contact details form
- Social media links inputs
- Portfolio URL input
- Save/Cancel buttons
- Loading states

### Project Creation Modal
- Project name input
- Description textarea
- Event name input
- Start date picker
- Branding toggle
- Watermark image upload
- Cover image upload
- Quota selector
- Create button

### Share Service Popup
- QR code display
- Shareable URL input
- Copy link button
- Download QR button
- Close button
- Option to add client email

### Album Settings Page (`/albums/[id]/settings`)
- Upload preferences section
  - Image quality dropdown
  - Video quality dropdown
  - Shorts quality dropdown
- Resolution settings
  - Max width input
  - Max height input
- Watermark section
  - Enable toggle
  - Image upload
  - Opacity slider
  - Position selector
- Features section
  - Face recognition toggle (with admin request)
  - Download toggle
  - Bulk download toggle
- Save/Cancel buttons

### Client Access Panel
- Client list table
  - User name/email
  - Access level
  - Granted date
  - Actions (revoke)
- Grant access button
  - User search/select
  - Access level dropdown

### Audit Log Page (`/admin/audit`)
- Filter bar
  - Date range picker
  - Action type dropdown
  - User filter
  - Entity type filter
- Audit log table
  - Timestamp
  - Action
  - User
  - Entity
  - Description
- Export button
- Pagination

---

## Security Considerations

### 1. Authentication
- All profile operations require valid session
- Middleware validates JWT tokens
- Ownership verified on every request

### 2. Authorization
```typescript
// Profile access check
const profile = await prisma.proProfile.findFirst({
  where: { userId: session.user.id }
})

// Album settings access check (owner, project owner, admin, superadmin)
const hasSettingsAccess = await checkAlbumSettingsAccess(user, album)
```

### 3. Audit Trail
- All sensitive operations logged
- User identification on every entry
- IP and user agent captured

### 4. Client Access
- Only users in the system can be granted access
- Access level enforced on API routes
- Revocation immediate

---

## Testing Guide

### Manual Testing Checklist

#### PRO Profile
- [ ] Create profile with all fields
- [ ] Upload logo image
- [ ] Update profile information
- [ ] View profile as different users

#### Project Management
- [ ] Create project with new fields
- [ ] Edit project branding toggle
- [ ] Upload cover image
- [ ] Set start date
- [ ] Delete project

#### Sharing
- [ ] Create share link
- [ ] Generate QR code
- [ ] Download QR code
- [ ] Access share link
- [ ] Revoke share link

#### Album Settings
- [ ] Update upload quality settings
- [ ] Configure watermark
- [ ] Toggle face recognition (creates task)
- [ ] Toggle download options

#### Client Access
- [ ] Grant client read access
- [ ] Grant client write access
- [ ] View client's access
- [ ] Revoke client access
- [ ] Client accesses project

#### Audit Logs
- [ ] View audit logs (as admin)
- [ ] Filter by action type
- [ ] Filter by date range
- [ ] Filter by user
- [ ] Export logs

### API Testing

```bash
# Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"name": "Test Project", "eventName": "Test Event", "startDate": "2024-06-15T00:00:00Z", "branding": true}'

# Update PRO profile
curl -X PATCH http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"businessName": "ABC Photography", "location": "New York"}'

# Grant client access
curl -X POST http://localhost:3000/api/projects/proj_123/clients \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"userId": "user_client_123", "accessLevel": "READ"}'

# Get audit logs (admin only)
curl http://localhost:3000/api/audit \
  -H "Cookie: next-auth.session-token=..."
```

---

## Error Handling

### Common Errors

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `PROJECT_NOT_FOUND` | 404 | Project doesn't exist |
| `ALBUM_NOT_FOUND` | 404 | Album doesn't exist |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `ACCESS_DENIED` | 403 | Cannot access this resource |
| `QUOTA_EXCEEDED` | 413 | Storage quota exceeded |

### Error Response Format
```typescript
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details?: { ... }
}
```

---

## Migration Notes

### Database Migration
```bash
# Phase 4 migration creates:
# - ProProfile table
# - ClientProjectAccess table
# - ClientAlbumAccess table
# - AlbumSettings table
# - AuditLog table
# - Updates Project table with new fields

npx prisma migrate dev --name phase_4_pro_features
```

### Breaking Changes
- AlbumSettings requires migration
- AuditLog requires new indexes
- Project model enhanced with new fields

---

## Performance Considerations

### 1. Database Indexes
```prisma
@@index([userId])           // ProProfile lookup
@@index([projectId, userId]) // Client access lookup
@@index([albumId])          // Album settings lookup
@@index([action])            // Audit log filtering
@@index([createdAt])         // Audit log date filtering
```

### 2. Pagination
- Audit logs paginated (100 per page)
- Client list paginated (20 per page)
- Project list paginated

### 3. Caching
- Share token validation cached briefly
- Profile data cached

---

## Configuration

### Environment Variables
```env
# Required for share URLs
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/frame?schema=public"

# Authentication
NEXTAUTH_SECRET=your-secret-key
```

### Default Settings
- **Default Project Quota**: 10GB
- **Default Image Quality**: HIGH (4000px)
- **Default Video Quality**: HIGH (4K)
- **Default Download**: Enabled

---

## References

- **Phase 4 Contract**: `.ai/contracts/phase-4-projects.md`
- **Phase 3 Auth**: `.ai/contracts/phase-3-auth.md`
- **Phase 1 Ingestion**: `.ai/contracts/phase-1-ingestion.md`
- **Database Schema**: `prisma/schema.prisma`

---

## Success Criteria ✅

- [x] PRO profiles can be created and managed
- [x] Projects have event details, branding, cover images
- [x] Share links include QR code generation
- [x] Album settings control upload quality and features
- [x] Client access can be granted and revoked
- [x] Audit logs track all critical operations
- [x] ADMIN/SUPERADMIN can view audit logs
- [x] All operations are secure and ownership-verified
- [x] Read-only client access enforced

---

**Last Updated**: 2026-02-18  
**Version**: 2.0.0  
**Status**: Production Ready
