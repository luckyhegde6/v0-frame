# FRAME - Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Phases 1-5 Complete  

---

## 1. Executive Summary

### 1.1 Product Overview

**FRAME** is a self-hosted, production-grade photo management platform designed for professional photographers, teams, and organizations. It provides a comprehensive solution for image ingestion, processing, organization, sharing, and administration with a focus on reliability, scalability, and data integrity.

### 1.2 Vision Statement

To create a secure, scalable photo management system that serves as a single source of truth for professional photography workflows, enabling seamless collaboration between photographers, clients, and administrators while maintaining full control over data and infrastructure.

### 1.3 Target Users

| User Type | Description | Key Needs |
|-----------|-------------|-----------|
| **SUPERADMIN** | System administrator | Full system control, user management, audit access |
| **ADMIN** | Organization admin | User management, system monitoring, job control |
| **PRO** | Professional photographer | Project management, client sharing, business profile |
| **CLIENT** | End client | View shared projects, download photos |
| **USER** | Standard user | Personal gallery, upload, organize |
| **ANONYMOUS** | Public visitors | Public pages, access requests, support queries |

---

## 2. Functional Requirements

### 2.1 Image Management (Phase 1, 2)

#### 2.1.1 Image Upload
- **FR-01**: Drag-and-drop file upload interface
- **FR-02**: Streaming upload to prevent memory issues
- **FR-03**: Automatic metadata extraction (EXIF, dimensions, size)
- **FR-04**: SHA-256 checksum verification
- **FR-05**: Support for JPEG, PNG, WebP, GIF, TIFF, RAW formats
- **FR-06**: Upload progress indication
- **FR-07**: Chunked upload support for large files

#### 2.1.2 Image Processing
- **FR-08**: Automatic thumbnail generation (64, 128, 256, 512px)
- **FR-09**: Web-optimized preview generation (max 2000px, JPEG quality 85)
- **FR-10**: EXIF data enrichment (camera, lens, GPS, date taken)
- **FR-11**: Background job processing with retry logic
- **FR-12**: Processing status indicators

#### 2.1.3 Image Lifecycle States
```
UPLOADED → INGESTED → PROCESSING → PROCESSED → STORED
                                    ↓
                                  FAILED
```

### 2.2 Authentication & Authorization (Phase 3)

#### 2.2.1 Authentication
- **FR-13**: Email/password authentication via NextAuth.js v5
- **FR-14**: JWT session management with role data
- **FR-15**: Password reset with magic link
- **FR-16**: Session timeout and refresh
- **FR-17**: Demo accounts for testing

#### 2.2.2 Role-Based Access Control (RBAC)
| Role | Permissions |
|------|-------------|
| **USER** | Personal gallery, upload, favorites |
| **PRO** | USER + Projects, Albums, Profile, Client management |
| **CLIENT** | View shared projects/albums only |
| **ADMIN** | PRO + User management, System admin |
| **SUPERADMIN** | ADMIN + System config, All users, Audit logs |

#### 2.2.3 Authorization
- **FR-18**: Middleware-based route protection
- **FR-19**: Resource-level ownership verification
- **FR-20**: API endpoint authorization checks

### 2.3 Projects & Albums (Phase 4)

#### 2.3.1 Projects
- **FR-21**: Create/Read/Update/Delete projects
- **FR-22**: Project metadata (name, description, event name, date)
- **FR-23**: Storage quota management (BigInt for large values)
- **FR-24**: Cover image selection
- **FR-25**: Branding/watermark toggle
- **FR-26**: Client access management

#### 2.3.2 Albums
- **FR-27**: Create albums within projects
- **FR-28**: Album categories (Photo Album, Cover Page, Shorts, Reels)
- **FR-29**: Album settings (quality, watermark, face recognition)
- **FR-30**: Image organization within albums

#### 2.3.3 Sharing
- **FR-31**: Token-based share links
- **FR-32**: Expiry date and access limits
- **FR-33**: QR code generation for share links
- **FR-34**: Public share view page

### 2.4 Admin Control Plane (Phase 5)

#### 2.4.1 Dashboard
- **FR-35**: User statistics
- **FR-36**: Storage usage metrics
- **FR-37**: Processing queue depth
- **FR-38**: Recent activity feed
- **FR-39**: System alerts panel

#### 2.4.2 Job Management
- **FR-40**: List/filter jobs by status
- **FR-41**: Job retry for failed jobs
- **FR-42**: Job cancellation for pending jobs
- **FR-43**: Force-run pending jobs
- **FR-44**: Job detail view with logs

#### 2.4.3 User Management
- **FR-45**: Create/edit/delete users
- **FR-46**: Role assignment
- **FR-47**: User gallery management

#### 2.4.4 PRO Requests
- **FR-48**: Track user requests (exports, face rec, etc.)
- **FR-49**: Request workflow (Start, Complete, Reject, Retry)
- **FR-50**: Admin notes and comments
- **FR-51**: Request notifications

#### 2.4.5 Password Reset Management
- **FR-52**: Admin password reset request management
- **FR-53**: Magic link generation and validation
- **FR-54**: Direct password reset by admin
- **FR-55**: Password validation (6-16 chars, alphanumeric)

### 2.5 Public Features

#### 2.5.1 Public Pages
- **FR-56**: About page (/about)
- **FR-57**: Help/Support page (/help)
- **FR-58**: Query submission form
- **FR-59**: Access request form (User/Client/PRO)

### 2.6 API & Documentation

#### 2.6.1 REST API
- **FR-60**: Full CRUD APIs for all resources
- **FR-61**: Swagger/OpenAPI documentation
- **FR-62**: Bearer token authentication
- **FR-63**: Cookie-based session auth

---

## 3. Technical Architecture

### 3.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ Browser │  │ Mobile  │  │   API   │  │  CLI    │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
└───────┼────────────┼────────────┼────────────┼─────────────┘
        │            │            │            │
        └────────────┴─────┬──────┴────────────┘
                           │
┌──────────────────────────┼────────────────────────────────┐
│                    NEXT.JS LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   UI (React) │  │  API Routes  │  │  Job Runner  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└──────────────────────────┼────────────────────────────────┘
                           │
┌──────────────────────────┼────────────────────────────────┐
│                   DATA LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ PostgreSQL   │  │   Storage    │  │   Supabase   │    │
│  │   (Prisma)  │  │  (Local/S3)  │  │   Storage    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16.1.5 |
| UI | React 19, TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| Storage | Local filesystem / Supabase Storage |
| Auth | NextAuth.js v5 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Image Processing | Sharp |
| API Docs | Swagger/OpenAPI |

### 3.3 Database Schema Overview

```
User (id, email, name, role, password)
  ├── Image (id, status, userId, albumId)
  │   ├── Job (id, type, status, imageId)
  │   ├── DetectedFace (id, imageId, faceGroupId)
  │   ├── DetectedObject (id, imageId)
  │   ├── ImageEmbedding (id, imageId)
  │   └── UserFavorite (id, userId, imageId)
  ├── Project (id, ownerId, quotaBytes, storageUsed)
  │   ├── Album (id, projectId)
  │   │   ├── AlbumSettings (id, albumId)
  │   │   ├── AlbumImage (id, albumId, imageId)
  │   │   └── FaceGroup (id, albumId)
  │   ├── ProjectImage (id, projectId, imageId)
  │   ├── ClientProjectAccess (id, projectId, userId)
  │   └── ShareToken (id, projectId)
  ├── ProProfile (id, userId)
  ├── Notification (id, userId)
  ├── AuditLog (id, userId)
  └── ProRequest (id, userId, projectId, albumId)

Account (id, userId, provider, access_token)
Session (id, userId, sessionToken, expires)
AdminTask (id, type, status, progress, payload)
PasswordReset (id, email, token, status)
PublicAccessRequest (id, email, accessType, status)
PublicQuery (id, email, subject, status)
```

### 3.4 API Endpoints Summary

| Category | Endpoints | Count |
|----------|-----------|-------|
| Auth | signin, signout, reset-password | 3 |
| Images | list, upload, get, delete, favorite, download | 6 |
| Albums | list, create, update, delete, settings, images | 9 |
| Projects | list, create, update, delete, images, clients | 9 |
| Share | create, view, request | 3 |
| Admin Jobs | list, retry, cancel, run | 5 |
| Admin Tasks | list, create, start | 4 |
| Admin Users | list, manage | 3 |
| Admin Stats | dashboard, storage | 2 |
| Public | query, access | 2 |
| Total | | **46+** |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Target | Phase |
|--------|--------|-------|
| Page Load Time | < 2s | All |
| Image Upload | < 5s per MB | Phase 1 |
| Thumbnail Generation | < 3s per image | Phase 2 |
| API Response Time | < 500ms | All |
| Job Processing | 1-2 jobs/second | Phase 2 |

### 4.2 Scalability

- **Horizontal Scaling**: Multiple Next.js instances with shared database
- **Job Processing**: Advisory locking for distributed workers
- **Storage**: Local filesystem, S3, or Supabase Storage backends
- **Database**: PostgreSQL with connection pooling

### 4.3 Security

See [Security Considerations](./.ai/docs/security-considerations.md) for detailed requirements.

### 4.4 Reliability

- **Job Idempotency**: All jobs must be safely retryable
- **Error Handling**: Comprehensive error catching with notifications
- **Data Integrity**: Checksums for all uploaded files
- **Audit Logging**: All significant actions logged

---

## 5. User Flows

### 5.1 Image Upload Flow
```
1. User navigates to /upload
2. Drags files or clicks to select
3. Client streams file to /api/upload
4. Server writes to temp storage
5. Server calculates checksum
6. Server creates Image record (status: INGESTED)
7. Server enqueues OFFLOAD_ORIGINAL job
8. Job runner picks up job
9. Job runner generates thumbnails/preview
10. Job runner extracts EXIF
11. Image status: PROCESSED
```

### 5.2 Password Reset Flow
```
1. User clicks "Forgot Password" on signin
2. Enters email address
3. Server creates PasswordReset record with magic link
4. User clicks magic link in email
5. Server validates token and expiry
6. User enters new password (6-16 chars, alphanumeric)
7. Server updates User password
8. PasswordReset status: COMPLETED
```

### 5.3 Client Access Flow
```
1. PRO creates project with client access
2. PRO generates share token with expiry
3. PRO sends link to client
4. Client visits /share/[token]
5. System validates token and expiry
6. Client views shared project
7. Client can download if enabled
```

---

## 6. Phase Roadmap

| Phase | Name | Status | Key Features |
|-------|------|--------|--------------|
| 0 | Baseline | ✅ Complete | UI scaffold, landing, upload, gallery |
| 1 | Ingestion | ✅ Complete | Streaming upload, metadata, jobs |
| 2 | Processing | ✅ Complete | Thumbnails, previews, EXIF, job runner |
| 3 | Auth & RBAC | ✅ Complete | NextAuth, roles, middleware, isolation |
| 4 | PRO Projects | ✅ Complete | Projects, albums, sharing, audit |
| 5 | Admin Control | ✅ Complete | Dashboard, job control, tasks, API docs |
| 6 | Intelligence | ⏳ Pending | Face recognition, object detection, vector search |
| 7 | Hardening | ⏳ Pending | RLS, backups, reliability |
| 8 | Home Server | ⏳ Pending | Long-term storage integration |

---

## 7. Demo Accounts

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| admin@frame.app | admin123 | SUPERADMIN | Full system access |
| admin2@frame.app | admin123 | ADMIN | Admin panel access |
| user@frame.app | user123 | USER | Basic gallery access |
| pro@frame.app | pro123 | PRO | Project/Album management |
| client@frame.app | client123 | CLIENT | Shared project access |

---

## 8. Key Pages

| Path | Access | Description |
|------|--------|-------------|
| / | Public | Landing page |
| /about | Public | About FRAME |
| /help | Public | Support & access requests |
| /auth/signin | Public | Login page |
| /reset-password | Public | Password reset |
| /gallery | USER+ | Personal gallery |
| /upload | USER+ | Upload interface |
| /projects | PRO+ | Project list |
| /albums | PRO+ | Album list |
| /profile | PRO+ | Business profile |
| /admin | ADMIN+ | Admin dashboard |
| /admin/users | ADMIN+ | User management |
| /admin/jobs | ADMIN+ | Job control |
| /admin/tasks | ADMIN+ | Task management |
| /admin/audit | ADMIN+ | Audit logs |
| /admin/requests | ADMIN+ | PRO requests |
| /admin/password-resets | ADMIN+ | Password resets |

---

## 9. Acceptance Criteria

### 9.1 Authentication
- [ ] Users can sign in with email/password
- [ ] Sessions persist across page refreshes
- [ ] Password reset flow works end-to-end
- [ ] Role-based route protection works

### 9.2 Image Management
- [ ] Files upload via drag-and-drop
- [ ] Thumbnails generate automatically
- [ ] EXIF data displays in image details
- [ ] Processing status updates in real-time

### 9.3 Projects & Albums
- [ ] PRO users can create/edit/delete projects
- [ ] Albums can be created within projects
- [ ] Share links work for clients
- [ ] Quota tracking is accurate

### 9.4 Admin
- [ ] Dashboard shows accurate statistics
- [ ] Jobs can be retried/cancelled
- [ ] PRO requests can be managed
- [ ] Audit logs are comprehensive

### 9.5 Security
- [ ] No unauthorized access to resources
- [ ] Passwords are hashed (bcrypt)
- [ ] API endpoints validate authorization
- [ ] Sensitive data not exposed in responses

---

## 10. Appendix

### 10.1 Environment Variables

```
DATABASE_URL / POSTGRES_PRISMA_URL
AUTH_SECRET / NEXTAUTH_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
SETUP_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 10.2 Build Commands

```bash
pnpm install      # Install dependencies
pnpm dev          # Development server
pnpm build        # Production build
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed database
pnpm docker:up    # Start PostgreSQL
pnpm lint         # Run ESLint
pnpm test         # Run tests
```

### 10.3 External Dependencies

- **Sharp**: Image processing
- **NextAuth.js**: Authentication
- **Prisma**: Database ORM
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **zod**: Input validation
