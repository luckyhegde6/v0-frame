# Phase 4 Implementation Plan: Projects & Sharing

## Overview
Phase 4 introduces professional project-based workflows with client sharing capabilities. This enables photographers to organize images into projects and share them securely with clients via token-based access.

## Key Features
- **Projects**: Logical groupings for organizing images
- **Project-scoped uploads**: Upload images directly to specific projects
- **Client sharing**: Secure, read-only, token-based access
- **Storage quotas**: Per-project storage limits with enforcement
- **Project isolation**: Strict separation between projects

## Implementation Checklist

### 1. Database Schema (Prisma)
- [x] Add `Project` model with owner relation
- [x] Add `ShareToken` model for client access
- [x] Update `Image` model with optional project relation
- [x] Add indexes for performance
- [x] Create migration

### 2. API Endpoints

#### Project Management
- [ ] `GET /api/projects` - List user's projects
- [ ] `POST /api/projects` - Create new project
- [ ] `GET /api/projects/[id]` - Get project details
- [ ] `PATCH /api/projects/[id]` - Update project
- [ ] `DELETE /api/projects/[id]` - Delete project

#### Project Images
- [ ] `GET /api/projects/[id]/images` - List project images
- [ ] Update `POST /api/upload` - Support projectId parameter
- [ ] `POST /api/images/[id]/move` - Move image between projects

#### Sharing
- [ ] `POST /api/projects/[id]/share` - Create share token
- [ ] `GET /api/projects/[id]/share` - List share tokens
- [ ] `DELETE /api/share/[token]` - Revoke share token
- [ ] `GET /api/share/[token]` - Validate and get share info
- [ ] `GET /api/share/[token]/images` - List images via share token

### 3. UI Components

#### Project Management
- [ ] Project list page (`/projects`)
- [ ] Project detail page (`/projects/[id]`)
- [ ] Create project modal
- [ ] Edit project modal
- [ ] Project card component
- [ ] Storage usage indicator

#### Sharing
- [ ] Share dialog/modal
- [ ] Share token list
- [ ] Copy share link functionality
- [ ] Client view page (`/share/[token]`)
- [ ] Read-only gallery for clients

#### Updates to Existing UI
- [ ] Add project selector to upload component
- [ ] Add project filter to gallery
- [ ] Show project assignment in image detail

### 4. Business Logic

#### Storage Quota
- [ ] Calculate current usage per project
- [ ] Check quota before upload
- [ ] Return appropriate error when quota exceeded
- [ ] Show usage in UI

#### Share Token Validation
- [ ] Check token exists
- [ ] Check token not expired
- [ ] Track access count
- [ ] Update last accessed timestamp
- [ ] Enforce read-only permissions

#### Project Isolation
- [ ] Ensure users can only access own projects
- [ ] Prevent cross-project image access
- [ ] Validate project ownership on all operations

### 5. File Storage

#### Structure
```
/users/{userId}/projects/{projectId}/{imageId}.{ext}
```

#### Operations
- [ ] Update storage service for project paths
- [ ] Handle project directory creation
- [ ] Ensure cleanup on project deletion

### 6. Security

#### Access Control
- [ ] Middleware for share token validation
- [ ] API route protection
- [ ] Role-based permissions (owner vs client)

#### Data Integrity
- [ ] Cascade delete project images
- [ ] Atomic operations for uploads
- [ ] Transaction safety

## API Specifications

### Project Endpoints

#### Create Project
```http
POST /api/projects
Content-Type: application/json

{
  "name": "Wedding Photography",
  "description": "John & Jane Wedding - June 2024",
  "quotaBytes": 10737418240 // 10GB
}
```

Response: `201 Created`
```json
{
  "id": "proj_123",
  "name": "Wedding Photography",
  "description": "John & Jane Wedding - June 2024",
  "quotaBytes": 10737418240,
  "usedBytes": 0,
  "ownerId": "user_456",
  "createdAt": "2024-06-01T00:00:00Z"
}
```

#### Create Share Token
```http
POST /api/projects/proj_123/share
Content-Type: application/json

{
  "clientEmail": "client@example.com",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

Response: `201 Created`
```json
{
  "token": "share_abc123xyz",
  "url": "http://localhost:3000/share/abc123xyz",
  "clientEmail": "client@example.com",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### Upload to Project
```http
POST /api/upload?projectId=proj_123
Content-Type: multipart/form-data

file: <binary image data>
```

### Error Responses

#### Quota Exceeded
```json
{
  "error": "Storage quota exceeded",
  "quotaBytes": 10737418240,
  "usedBytes": 10737418240,
  "requestedBytes": 5242880
}
```

#### Invalid Share Token
```json
{
  "error": "Invalid or expired share token"
}
```

#### Cross-project Access Attempt
```json
{
  "error": "Access denied: Cross-project access forbidden"
}
```

## Database Schema

### Project Model
```prisma
model Project {
  id            String    @id @default(cuid())
  name          String
  description   String?
  ownerId       String
  owner         User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  images        Image[]
  shareTokens   ShareToken[]
  quotaBytes    Int       @default(5368709120)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([ownerId])
}
```

### ShareToken Model
```prisma
model ShareToken {
  id              String    @id @default(cuid())
  token           String    @unique
  projectId       String
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  clientEmail     String?
  expiresAt       DateTime?
  canUpload       Boolean   @default(false)
  canDelete       Boolean   @default(false)
  accessCount     Int       @default(0)
  lastAccessedAt  DateTime?
  createdAt       DateTime  @default(now())
  
  @@index([token])
  @@index([projectId])
  @@index([expiresAt])
}
```

### Updated Image Model
```prisma
model Image {
  // ... existing fields ...
  projectId     String?
  project       Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)
  // ... rest of fields ...
  
  @@index([projectId])
}
```

## UI/UX Design

### Project List Page
- Grid layout of project cards
- Each card shows: name, image count, storage usage bar
- "New Project" button
- Filter/search projects

### Project Detail Page
- Header: Project name, description, storage usage
- Action buttons: Upload, Share, Edit, Delete
- Image gallery (scoped to project)
- Share management section

### Share Dialog
- Generate link button
- Optional: Set expiry date
- Optional: Specify client email
- Copy link button
- List of active shares with revoke option

### Client Share View
- Clean, minimal interface
- Project title and description
- Image gallery (read-only)
- "Shared by [Owner Name]" footer
- No upload/delete buttons

## Testing Strategy

### Unit Tests
- Project CRUD operations
- Share token validation
- Quota calculations
- File path generation

### Integration Tests
- Upload to project flow
- Share and access via token
- Project deletion cascade
- Cross-project access prevention

### E2E Tests
- Create project → Upload images → Share → Client view
- Quota enforcement
- Token expiry handling

## Security Considerations

1. **Authorization**: All project endpoints must verify ownership
2. **Token Security**: Share tokens should be cryptographically random
3. **Expiry**: Support optional token expiration
4. **Rate Limiting**: Consider rate limits on share token access
5. **CORS**: Proper CORS headers for client share views

## Performance Optimizations

1. **Indexes**: All foreign keys and query fields indexed
2. **Pagination**: Image lists paginated (20 per page)
3. **Lazy Loading**: Images loaded on demand
4. **Caching**: Share token validation cached briefly
5. **CDN**: Client share views served via CDN if applicable

## Deployment Notes

1. Run database migration
2. Update storage service configuration
3. Configure middleware for share routes
4. Test quota enforcement with large files
5. Validate cross-project isolation

## Future Enhancements (Post Phase 4)

- Watermarking for client previews
- Download all images as ZIP
- Client comments/approvals
- Multiple client access levels
- Project templates
- Batch move images between projects
