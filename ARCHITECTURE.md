# FRAME Architecture

## Overview

FRAME is a self-hosted, production-grade photo management platform built on Next.js. It provides a complete solution for image ingestion, processing, organization, sharing, and administration.

## Core Principles

1. **Single Source of Truth**: The home server (Next.js in Node runtime) acts as the single source of truth for all data and operations
2. **Originals are Immutable**: Original images are never modified; all processing happens on derived copies
3. **Async Processing**: All heavy operations are handled via background jobs
4. **Job Idempotency**: All jobs must be safely retryable without side effects
5. **Streaming First**: Uploads and downloads stream directly to/from storage
6. **Fail-Fast Recovery**: Failures are expected and recoverable

## System Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Browser  │  │  Mobile  │  │ REST API │  │  Bearer  │  │ Webhook  │  │
│  │   (UI)   │  │    (PWA) │  │   Client │  │   Token  │  │          │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼────────────┼─────────────┼─────────────┼─────────────┼──────────┘
        │            │             │             │             │
        └────────────┴──────┬──────┴─────────────┴─────────────┘
                            │
┌───────────────────────────┼───────────────────────────────────────────────┐
│                     NEXT.JS RUNTIME LAYER                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │   UI (React)   │  │  API Routes    │  │ Job Runner     │            │
│  │   Pages/App    │  │  REST/GraphQL  │  │ (Background)   │            │
│  │                │  │                │  │                │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    MIDDLEWARE LAYER                                  │  │
│  │  - Route protection                                                  │  │
│  │  - Authentication verification                                       │  │
│  │  - Rate limiting (future)                                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    SERVICE LAYER                                     │  │
│  │  - Auth Service (NextAuth.js)                                       │  │
│  │  - Storage Service (Local/Supabase)                                 │  │
│  │  - Job Service (Queue management)                                    │  │
│  │  - Audit Service (Logging)                                           │  │
│  │  - Notification Service                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────────────┐
│                       DATA LAYER                                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │
│  │  PostgreSQL    │  │   File System  │  │  Supabase      │              │
│  │  (Prisma ORM) │  │   (Temp/Derived)│ │  Storage (S3)  │              │
│  │                │  │                │  │                │              │
│  │  - Users       │  │  - Temp files │  │  - User gallery│              │
│  │  - Images      │  │  - Thumbnails │  │  - Projects    │              │
│  │  - Projects    │  │  - Previews   │  │  - Albums      │              │
│  │  - Albums      │  │                │  │  - Backups     │              │
│  │  - Jobs        │  │                │  │                │              │
│  │  - Audit Logs  │  │                │  │                │              │
│  └────────────────┘  └────────────────┘  └────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Image Lifecycle

### Standard Lifecycle (Phases 1-7)
```
UPLOADED
   │
   ▼
INGESTED (temp cloud storage)
   │
   ▼
PROCESSING (background asset generation)
   ├─► Thumbnail generation (64, 128, 256, 512px)
   ├─► Preview generation (max 2000px, JPEG Q85)
   ├─► EXIF enrichment (camera, lens, GPS)
   └─► All jobs complete
         │
         ▼
   PROCESSED (all assets ready in cloud)
```

### Extended Lifecycle (With Phase 8)
```
PROCESSED
   │
   ▼
[Phase 8: Home Server Integration]
   │
   ▼
STORED (original moved to home server)
```

## Processing Pipeline

The job runner processes the following job types:

| Job Type | Handler | Description |
|----------|---------|-------------|
| OFFLOAD_ORIGINAL | handleOffloadOriginal | Move/store original file |
| THUMBNAIL_GENERATION | handleThumbnailGeneration | Generate multiple sizes |
| PREVIEW_GENERATION | handlePreviewGeneration | Generate web preview |
| EXIF_ENRICHMENT | handleExifEnrichment | Extract EXIF metadata |

## Role-Based Access Control

```
                    ┌─────────────┐
                    │  SUPERADMIN │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    ADMIN    │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │    PRO   │    │   USER   │    │   CLIENT  │
    └───────────┘    └───────────┘    └───────────┘
```

### Permission Matrix

| Feature | USER | PRO | CLIENT | ADMIN | SUPERADMIN |
|---------|------|-----|--------|-------|------------|
| Personal Gallery | ✅ | ✅ | ❌ | ✅ | ✅ |
| Upload Images | ✅ | ✅ | ❌ | ✅ | ✅ |
| Create Projects | ❌ | ✅ | ❌ | ✅ | ✅ |
| Create Albums | ❌ | ✅ | ❌ | ✅ | ✅ |
| Share Projects | ❌ | ✅ | ❌ | ✅ | ✅ |
| Business Profile | ❌ | ✅ | ❌ | ❌ | ❌ |
| View Shared | ❌ | ❌ | ✅ | ✅ | ✅ |
| Admin Dashboard | ❌ | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ | ✅ |
| System Settings | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ❌ | ✅ | ✅ |

## API Architecture

### REST API Design

```
/api
  ├── /auth
  │   ├── [...nextauth]    # NextAuth.js handlers
  │   └── /reset-password # Password reset
  ├── /images             # Image CRUD
  ├── /albums             # Album CRUD
  ├── /projects           # Project CRUD
  ├── /share              # Sharing endpoints
  ├── /public             # Public endpoints (query, access)
  ├── /admin
  │   ├── /users          # User management
  │   ├── /jobs           # Job management
  │   ├── /tasks          # Task management
  │   ├── /stats          # Dashboard stats
  │   ├── /audit          # Audit logs
  │   ├── /requests       # PRO requests
  │   └── /password-resets # Password resets
  └── /token              # API token generation
```

### Authentication Methods

1. **Cookie Session** (Default): NextAuth.js session cookie
2. **Bearer Token**: For API-only access
3. **Magic Link**: For password reset

## Storage Architecture

### Storage Backends

| Backend | Use Case | Configuration |
|---------|----------|---------------|
| Local Filesystem | Development | `STORAGE_DIR=/tmp/storage` |
| Supabase Storage | Production/Cloud | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

### Storage Paths

```
storage/
├── temp/
│   └── ingest/           # Temporary upload staging
├── thumbnails/
│   └── {imageId}/
│       ├── thumb-64.jpg
│       ├── thumb-128.jpg
│       ├── thumb-256.jpg
│       └── thumb-512.jpg
├── processed/
│   └── {imageId}/
│       └── preview.jpg
└── user/                  # User gallery (Supabase)
    └── {userId}/
        └── Gallery/
            └── images/
                └── {imageId}.{ext}
```

## Database Schema (High-Level)

### Core Entities

```
User
├── id, email, name, role, password
├── images (owned)
├── projects (owned)
├── albums (owned)
├── proProfile
└── auditLogs

Image
├── id, status, checksum, mimeType
├── userId (owner)
├── albumId (optional)
├── thumbnailPath, previewPath
├── EXIF fields (make, model, GPS, etc.)
└── jobs (processing)

Project
├── id, name, quotaBytes, storageUsed
├── ownerId
├── albums[]
└── clientAccess[]

Album
├── id, name, category
├── ownerId, projectId
├── settings (quality, watermark, face rec)
└── images[]

Job
├── id, type, status
├── imageId
├── attempts, maxAttempts
├── lockedAt, lockedBy
└── lastError

AuditLog
├── id, action, entityType, entityId
├── userId, userEmail
├── oldValue, newValue
├── ipAddress, userAgent
└── createdAt
```

## Job Runner Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    JOB RUNNER (Background)                   │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Polling   │───►│   Picking   │───►│  Processing │    │
│  │   (5s/loop) │    │  (batch=5)  │    │  (handlers) │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│         │                  │                   │            │
│         ▼                  ▼                   ▼            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │  Advisory   │    │   Idempotent │    │   Retry     │    │
│  │   Locking   │    │   Execution  │    │   Logic     │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Job Lifecycle

```
PENDING ──► RUNNING ──► COMPLETED
    │          │
    │          └──────────► FAILED
    │                        │
    └────────────────────────┘ (retry up to maxAttempts)
```

## Security Architecture

### Authentication Flow

```
1. User submits credentials
2. NextAuth.js validates (bcrypt compare)
3. JWT created with user role
4. Session cookie set (httpOnly, secure)
5. Middleware validates on each request
```

### Authorization Flow

```
1. Request hits middleware
2. Middleware checks session
3. Route handler verifies role
4. API endpoint checks resource ownership
5. Response returned or 401/403
```

### Security Headers

- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- Content Security Policy (CSP)

## Scalability Considerations

### Horizontal Scaling

- Multiple Next.js instances with shared database
- Advisory locking prevents duplicate job processing
- Stateless session storage (JWT)

### Vertical Scaling

- Configurable job batch size
- Adjustable polling interval
- Memory-efficient streaming

### Storage Scaling

- Local filesystem → Supabase Storage (S3)
- CDN integration for thumbnails
- Object storage for originals

## Deployment Options

### Development
```
pnpm local  # Docker + DB + Seed + Dev server
```

### Production (Vercel)
```
git push   # Auto-deploys to Vercel
```

### Production (Self-Hosted)
```
Next.js on Node.js + PostgreSQL + Storage
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `AUTH_SECRET` | Yes | NextAuth.js secret |
| `ADMIN_EMAIL` | Yes | Superadmin email |
| `ADMIN_PASSWORD` | Yes | Superadmin password |
| `SETUP_SECRET` | Yes | Setup API secret |
| `SUPABASE_URL` | No | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service key |

## Key Files

| Path | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema |
| `app/api/*/route.ts` | API endpoints |
| `lib/jobs/*` | Job processing |
| `lib/auth.ts` | Authentication |
| `lib/storage.ts` | Storage abstraction |
| `middleware.ts` | Route protection |
| `app/*/page.tsx` | UI pages |

## External Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| NextAuth.js | Authentication | ✅ |
| Prisma | Database ORM | ✅ |
| Sharp | Image processing | ✅ |
| Supabase Storage | Cloud storage | ✅ |
| Swagger/OpenAPI | API docs | ✅ |
| Inngest | Serverless jobs | Optional |

## Monitoring & Observability

### Logs

- **Job Runner**: `[Job Runner]` prefix
- **Upload API**: `[Upload API]` prefix
- **Job Enqueue**: `[Job Enqueue]` prefix
- **Handlers**: Handler-specific prefixes

### Metrics

- Job success/failure rate
- Processing queue depth
- Storage usage
- User activity

---

*Last Updated: February 2026*
