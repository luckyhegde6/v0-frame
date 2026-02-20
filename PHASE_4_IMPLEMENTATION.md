# Phase 4 Implementation Plan: Professional Projects & PRO Features

## Overview
Phase 4 introduces professional project-based workflows with client sharing capabilities, PRO profile management, album settings, and comprehensive audit logging.

## Key Features
- **Projects**: Logical groupings for organizing images with event details
- **PRO Profile**: Business profile with logo, location, contact, social links
- **Client Sharing**: Secure, token-based access with QR codes
- **Storage Quotas**: Per-project storage limits with enforcement
- **Album Settings**: Upload quality, resolution, watermark, face recognition
- **Audit Logging**: Comprehensive activity tracking for admins
- **Client Access**: Linked clients with granular permissions

## Implementation Checklist

### 1. PRO Profile System
- [ ] Create `ProProfile` model
- [ ] `GET /api/profile` - Get PRO profile
- [ ] `PATCH /api/profile` - Update PRO profile
- [ ] Profile page UI (`/profile`)
- [ ] Business logo upload
- [ ] Social media links management
- [ ] Previous works/portfolio links

### 2. Project Enhancements
- [ ] Add `startDate`, `branding`, `watermarkImage`, `coverImage` to Project
- [ ] `POST /api/projects` - Create with new fields
- [ ] `PATCH /api/projects/[id]` - Update project details
- [ ] Project creation modal with service generation popup
- [ ] QR code generation for share links

### 3. Album Settings
- [ ] Create `AlbumSettings` model
- [ ] Album settings page/modal
- [ ] Upload size preferences (image/video/shorts by quality)
- [ ] Resolution settings
- [ ] Watermark management
- [ ] Face recognition toggle (creates AdminTask)
- [ ] Download toggle per album

### 4. Client Access Management
- [ ] `ClientProjectAccess` model
- [ ] `ClientAlbumAccess` model
- [ ] Grant/revoke client access APIs
- [ ] Client list in project detail page
- [ ] User selection for access grants

### 5. Audit Logging
- [ ] Create `AuditLog` model
- [ ] Log storage usage changes
- [ ] Log project CRUD operations
- [ ] Log share link events
- [ ] Log user management actions
- [ ] Audit log page for ADMIN/SUPERADMIN

### 6. Database Schema (Prisma)

```prisma
// PRO Profile
model ProProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  businessName    String?
  logo            String?  // URL to logo
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

// Enhanced Project Model
model Project {
  id              String    @id @default(cuid())
  name            String
  description     String?
  eventName       String?   // Event/Project name
  startDate       DateTime? // Project start date
  branding        Boolean   @default(false) // Enable branding/watermark
  watermarkImage  String?   // Watermark image URL
  coverImage      String?   // Cover image URL
  
  quotaBytes      BigInt    @default(10737418240) // 10GB
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

  @@unique([name, ownerId])
  @@index([ownerId])
}

// Client Project Access
model ClientProjectAccess {
  id          String        @id @default(cuid())
  projectId   String
  project     Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId      String        // Client user ID
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessLevel AccessLevel   @default(READ)
  
  grantedById String
  grantedBy   User          @relation(fields: [grantedById], references: [id], onDelete: Cascade)
  
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
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessLevel AccessLevel   @default(READ)
  
  grantedById String
  grantedBy   User          @relation(fields: [grantedById], references: [id], onDelete: Cascade)
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([albumId, userId])
  @@index([albumId])
  @@index([userId])
}

// Album Settings
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
  watermarkOpacity Float           @default(0.5)
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

// Audit Log
model AuditLog {
  id          String      @id @default(cuid())
  action      AuditAction
  entityType  String      // project, album, user, share, job
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

// Updated User model
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          Role      @default(USER)
  
  accounts      Account[]
  sessions      Session[]
  images        Image[]
  collections   Collection[]
  projects      Project[]
  shareTokens   ShareToken[]
  notifications Notification[]
  adminTasks    AdminTask[]
  albums        Album[]
  projectAccess ProjectAccess[]
  proProfile    ProProfile?
  clientProjectAccess  ClientProjectAccess[]
  clientAlbumAccess    ClientAlbumAccess[]
  auditLogs     AuditLog[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### 7. API Endpoints

#### PRO Profile
- `GET /api/profile` - Get current user's PRO profile
- `PATCH /api/profile` - Update PRO profile
- `POST /api/profile/logo` - Upload business logo

#### Project Management
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `GET /api/projects/[id]/clients` - List clients with access
- `POST /api/projects/[id]/clients` - Grant client access
- `DELETE /api/projects/[id]/clients/[userId]` - Revoke client access

#### Album Settings
- `GET /api/albums/[id]/settings` - Get album settings
- `PATCH /api/albums/[id]/settings` - Update album settings
- `POST /api/albums/[id]/settings/face-recognition` - Request face recognition

#### Audit Logs (ADMIN/SUPERADMIN only)
- `GET /api/audit` - List audit logs with filters
- `GET /api/audit/export` - Export audit logs

### 8. UI Components

#### PRO Profile Page (`/profile`)
- Business name and logo
- Location with map
- Contact details
- Social media links (Facebook, Instagram, Twitter, LinkedIn)
- Portfolio/previous works link
- Edit profile button

#### Project Enhancements
- Project creation modal with new fields
- Event name / Project name field
- Start date picker
- Branding toggle (enable watermark)
- Watermark image upload
- Cover image upload
- Share service popup after project creation (QR code + link)

#### Album Settings Page (`/albums/[id]/settings`)
- Upload size dropdowns (image/video/shorts by quality)
- Resolution inputs (width x height)
- Watermark configuration
- Face recognition toggle
- Download toggles
- Save/Cancel buttons

#### Audit Page (`/admin/audit`)
- Filterable audit log table
- Date range picker
- Action type filter
- User filter
- Entity type filter
- Export functionality
- Storage usage summary

### 9. Security Considerations

- PRO profile only editable by PRO users (and ADMIN/SUPERADMIN)
- Album settings only editable by album owner, PROJECT owner, ADMIN, SUPERADMIN
- Audit logs only accessible by ADMIN and SUPERADMIN
- Client access grants limited to users in the system
- All sensitive operations logged in audit trail

### 10. QR Code Generation
- Generate QR codes for share links
- Use `qrcode` library
- Display QR code in share popup
- Option to download QR code as image

## API Specifications

### Create Project
```http
POST /api/projects
Content-Type: application/json

{
  "name": "Wedding Photography",
  "description": "John & Jane Wedding - June 2024",
  "eventName": "John & Jane Wedding",
  "startDate": "2024-06-15T00:00:00Z",
  "branding": true,
  "quotaBytes": 10737418240
}
```

### Update PRO Profile
```http
PATCH /api/profile
Content-Type: application/json

{
  "businessName": "ABC Photography",
  "location": "New York, NY",
  "phone": "+1-555-123-4567",
  "email": "contact@abcphoto.com",
  "website": "https://abcphoto.com",
  "facebook": "https://facebook.com/abcphoto",
  "instagram": "https://instagram.com/abcphoto",
  "portfolioUrl": "https://abcphoto.com/portfolio"
}
```

### Album Settings
```http
PATCH /api/albums/[id]/settings
Content-Type: application/json

{
  "imageQuality": "HIGH",
  "videoQuality": "HIGH",
  "maxImageWidth": 4000,
  "maxImageHeight": 4000,
  "watermarkEnabled": true,
  "watermarkPosition": "BOTTOM_RIGHT",
  "downloadEnabled": true,
  "bulkDownloadEnabled": true
}
```

### Audit Log Entry
```json
{
  "id": "audit_123",
  "action": "PROJECT_CREATED",
  "entityType": "project",
  "entityId": "proj_456",
  "userId": "user_789",
  "userEmail": "pro@frame.app",
  "description": "Created project 'Wedding Photography'",
  "createdAt": "2024-06-01T00:00:00Z"
}
```

## Error Responses

### Unauthorized
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

### Forbidden
```json
{
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```

### Not Found
```json
{
  "error": "Resource not found",
  "code": "NOT_FOUND"
}
```

## Testing Strategy

### Unit Tests
- PRO profile CRUD operations
- Project field validations
- Audit log creation
- Access control checks
- Settings validation

### Integration Tests
- Full project creation flow
- Client access grant flow
- Audit log generation
- Album settings update

### E2E Tests
- PRO profile creation → Project creation → Share → Client access
- Album settings modification flow
- Audit log verification

## Security Considerations

1. **Authorization**: All profile endpoints verify PRO role
2. **Token Security**: Share tokens are cryptographically random
3. **Audit Trail**: All sensitive operations logged
4. **Access Control**: Role-based permissions enforced
5. **Data Validation**: Input sanitization on all endpoints

## Performance Optimizations

1. **Indexes**: All foreign keys and query fields indexed
2. **Pagination**: Log lists paginated
3. **Lazy Loading**: Images loaded on demand
4. **Caching**: Share validation cached briefly

## Deployment Notes

1. Run database migration for new models
2. Update storage service for profile logos
3. Configure middleware for audit routes
4. Test quota enforcement
5. Validate access control

## Future Enhancements (Post Phase 4)

- Multi-language support
- Email notifications for client access
- Advanced analytics dashboard
- White-label options
- API rate limiting
