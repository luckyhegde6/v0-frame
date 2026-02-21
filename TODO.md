# TODO — Photo Management System (FRAME)

This file defines the execution roadmap for FRAME.
Work MUST proceed in phases. The goal is not feature velocity — it is system correctness,
reliability, and long-term maintainability.

**NOTE**: Home Server integration has been moved to Phase 8 (Final Phase).
Phase 2-7 now operate entirely within the cloud/temporary storage environment.

---

## PHASE 0 — Baseline Architecture
Status: ✅ COMPLETE

### Goals
- Establish the fundamental codebase structure and UI scaffold.
- Define the self-hosted, "unified runtime" architecture.
- Set up standardized AI agent configuration for autonomous development.

### Tasks
- [x] Next.js App Router scaffold
- [x] Landing page
- [x] Upload UI (drag & drop)
- [x] Gallery UI
- [x] Image detail modal
- [x] Vercel deployment (UI/Validation)
- [x] Basic metadata display (size, format, dimensions)
- [x] Standardized AI configuration ([.ai/](./.ai/))
- [x] Self-hosted architecture definition

---

## PHASE 1 — Ingestion Foundation
Status: ✅ COMPLETE

### Goals
- Establish a correct, explicit image ingestion lifecycle.
- Ensure streaming-first file handling directly to local storage.
- Implement strictly enforceable API contracts (no shortcuts).

### Tasks
- [x] **Contracts**: Defined Phase 1 Ingestion Contracts ([.ai/contracts/phase-1-ingestion.md](./.ai/contracts/phase-1-ingestion.md))
- [x] **Review Phase 1 Ingestion Contracts** (`.ai/contracts/phase-1-ingestion.md`)
- [x] Define ImageStatus enum (UPLOADED → INGESTED → FAILED only)
- [x] Introduce Prisma schema for Image records (per contract §5)
- [x] Implement temporary file storage on server (per contract §3)
- [x] Refactor `/api/upload` to contract-compliant implementation:
  - [x] accept streams (no buffering)
  - [x] save to temp storage (deterministic naming)
  - [x] create DB record (status: INGESTED)
  - [x] enqueue offload job (fire-and-forget)
  - [x] **comply with Upload API Contract (§2)**
- [x] Add checksum calculation (SHA-256, per contract §4)
- [x] Extract basic metadata only (6 fields per contract §4)
- [x] Implement job enqueue stub (per contract §6)
- [x] Implement error handling (per contract §7)
- [x] Add logging (per contract §9)
- [x] Ensure temp files are NOT treated as durable
- [x] **Prisma**: Define `ImageStatus` (UPLOADED, INGESTED, FAILED) and base `Image` model
- [x] **Storage**: Implement streaming file storage on temporary filesystem
- [x] **Upload API**: Contract-compliant implementation (streaming, metadata extraction, checksum)
- [x] **Jobs**: Job enqueue logic (stubbed/basic)

---

## PHASE 2 — Job Runner and Asset Processing (LOCAL STORAGE)

Status: ✅ COMPLETE

> [!IMPORTANT]
> **Phase 2 now focuses on cloud/local asset processing only.**
> Home Server offload has been moved to Phase 8.
> All processing happens in the cloud/temporary storage environment.

### Goals
- Automatically generate web-optimized previews and thumbnails for all ingested images.
- Improve gallery UX by loading optimized assets instead of originals.
- Establish robust background job processing infrastructure.
- preserve lossless originals in temporary storage while providing a snappy interface.

### Tasks Completed
- [x] **Job Runner Infrastructure**
  - [x] Database-backed job persistence
  - [x] Advisory locking mechanism
  - [x] Retry logic with exponential backoff
  - [x] Polling loop with configurable batch size
  - [x] Error handling and dead letter queue
 
- [x] **OFFLOAD_ORIGINAL Handler (Simplified)**
  - [x] Skip actual file movement (no home server yet)
  - [x] Mark image as PROCESSING state
  - [x] Enqueue derived asset generation jobs
  - [x] Keep temp file in place (will move in Phase 8)
 
- [x] **THUMBNAIL_GENERATION Handler**
  - [x] Generate multiple thumbnail sizes (64, 128, 256, 512px)
  - [x] Store in deterministic paths
  - [x] Use Sharp for high-quality resizing
 
- [x] **PREVIEW_GENERATION Handler**
  - [x] Generate web-optimized preview (max 2000px)
  - [x] JPEG quality 85 with progressive encoding
  - [x] Store in deterministic path
 
- [x] **EXIF_ENRICHMENT Handler**
  - [x] Extract full EXIF metadata
  - [x] Parse GPS coordinates
  - [x] Extract camera/lens information
  - [x] Store in database
 
- [x] **Gallery Integration**
  - [x] Update UI to load thumbnails/previews
  - [x] Add processing status indicators
  - [x] Implement polling for processing updates
 
- [x] **Admin APIs**
  - [x] `GET /api/admin/jobs` - List jobs with filtering
  - [x] `GET /api/admin/jobs/:id` - View job details

---

## PHASE 3 — Auth & Access Control
Status: ✅ COMPLETE

### Goals
- Secure the platform with robust authentication and granular RBAC (Role Based Access Control).
- Ensure resource-level isolation (users only see their own images).
- Protect the filesystem and administrative APIs.

### Tasks Completed
- [x] **Roles**: Implement USER / PRO / CLIENT / ADMIN role model in Prisma schema
- [x] **Auth**: Integrate NextAuth.js v5 with Credentials provider
  - [x] Create auth API routes
  - [x] Configure JWT sessions with role data
  - [x] Create middleware for route protection
- [x] **UI**: Create authentication pages and components
  - [x] Signin page with demo accounts
  - [x] User navigation dropdown
  - [x] Update gallery navigation
- [x] **Isolation**: Route-level and resource-level access control
  - [x] Middleware protects /gallery, /upload routes
  - [x] Admin-only protection for /admin routes
  - [x] Update API routes to filter by userId
  - [x] Add userId to Image records
- [x] **Navigation**: Enhanced UI/UX
  - [x] Header component with breadcrumbs
  - [x] Back button navigation
  - [x] Dynamic landing page (Sign In vs Logout)
  - [x] Admin dashboard with stats
- [x] **Error Handling**: Non-blocking toast notifications
  - [x] Error handler utility with severity levels
  - [x] Toast notifications for user feedback
  - [x] Console logging for critical errors
  - [x] Error log management

### Demo Accounts
- admin@frame.app / admin123 (ADMIN)
- user@frame.app / user123 (USER)
- pro@frame.app / pro123 (PRO)
- client@frame.app / client123 (CLIENT)

---

## PHASE 4 — Professional Projects
Status: ✅ COMPLETE

### Goals
- Enable organizational groupings (Projects) for professional photography workflows.
- Implement secure, time-limited sharing mechanisms for clients.
- Provide storage management and quota enforcement.
- PRO profile management with business details.
- Album settings and configuration.
- Comprehensive audit logging for admin/superadmin.

### Tasks Completed
- [x] **Database Schema**
  - [x] Project model with quota management
  - [x] ProjectImage join table
  - [x] ShareToken model for client sharing
  - [x] ProProfile model for business profile
  - [x] AuditLog model for comprehensive logging
  - [x] AlbumSettings model for album configuration
  - [x] ClientProjectAccess model for linked clients
- [x] **PRO Profile**
  - [x] Create profile page (/profile) for PRO users
  - [x] Fields: name, business logo, location, contact details, social media links, previous works link
  - [x] Edit profile functionality
  - [x] Profile visibility settings
- [x] **Project Management**
  - [x] Create/Update/Delete projects
  - [x] List user projects with pagination
  - [x] Event/Project name, start date, branding/watermark toggle
  - [x] Cover image for project
  - [x] Linked clients table in project
- [x] **Project Images**
  - [x] Add/remove images from projects
  - [x] Project-scoped image queries
- [x] **Sharing & QR Codes**
  - [x] Generate share tokens
  - [x] Share token expiry and access limits
  - [x] Public share view page
  - [x] QR code generation for share links
  - [x] Add service popup for generating links (after project creation)
- [x] **Album Settings**
  - [x] Album settings page/modal (PRO/ADMIN/SUPERADMIN only)
  - [x] Preferred upload size for images/videos/shorts (quality-based)
  - [x] Image resolution settings
  - [x] Watermark configuration (add/edit)
  - [x] Face recognition toggle (creates admin request job)
  - [x] Enable/Disable download album toggle
  - [x] Delete album access control
- [x] **Audit & Logging**
  - [x] AuditLog table for tracking:
    - Storage usage changes
    - Project create/edit/delete events
    - Share link generation/revocation
    - Job event generation
    - User create/edit/delete actions
  - [x] Audit page for ADMIN/SUPERADMIN only
  - [x] Filter audit logs by type, date, user
- [x] **Client Access Management**
  - [x] Project-Client access table
  - [x] Album access table
  - [x] PRO can grant Read access to clients from Users list
  - [x] Permission inheritance from project to album
- [x] **Quotas**
  - [x] Storage usage tracking
  - [x] Quota enforcement on upload
  - [x] Quota display in UI

---

## PHASE 5 — Admin Control Plane
Status: ✅ COMPLETE

### Goals
- Provide a centralized dashboard for system observability and management.
- Expose interactive API documentation (Swagger) for ecosystem growth.
- Monitor server health, job queues, and hardware statistics.

### Tasks Completed

#### 5.1 Schema Updates
- [x] Add `CANCELLED` to `JobStatus` enum
- [x] Add `JOB_RETRY`, `JOB_CANCELLED`, `JOB_FORCE_RUN` to `AuditAction` enum

#### 5.2 Job Control API
- [x] `POST /api/admin/jobs/[id]/retry` - Retry failed jobs
- [x] `POST /api/admin/jobs/[id]/cancel` - Cancel pending jobs
- [x] `POST /api/admin/jobs/[id]/run` - Force run pending jobs
- [x] Audit logging for all job control actions

#### 5.3 Job Control UI
- [x] Update `/admin/jobs` page with action buttons
- [x] Add retry button for FAILED jobs
- [x] Add cancel button for PENDING jobs
- [x] Add job detail modal/drawer
- [x] Add bulk job operations

#### 5.4 Enhanced Dashboard
- [x] Add real-time stats refresh
- [x] Fix total users count on admin dashboard
- [x] Add processing queue depth indicator
- [x] Add recent activity feed
- [x] Add system alerts panel

#### 5.5 Server Health & Analytics
- [x] Enhanced system health page
- [x] Memory usage stats
- [x] Processing throughput metrics
- [x] Error rate tracking

#### 5.6 API Documentation
- [x] Add job control endpoints to Swagger
- [x] Add request/response examples
- [x] Ensure all admin endpoints documented
- [x] Fix Swagger auth for logged-in users (moved to /admin/api-docs)
- [x] Add API token endpoint for programmatic access
- [x] Add BearerAuth/CookieAuth guide
- [x] Add swagger for Notifications, Uploads, Share, PRO requests, Auth, Token

#### 5.7 Tasks Panel Integration
- [x] Connect Tasks panel to Jobs system
- [x] Add task types: Compress Images, Generate Thumbnails
- [x] Add task scheduling and execution
- [x] Add task progress tracking
- [x] Create dedicated task configuration pages
- [x] Add source selection (Project, Album, Images)
- [x] Add configuration options per task type
- [x] Map task types to job creation

#### 5.8 Album & Favorites
- [x] Fix album image display issues
- [x] Add UserFavorite model for favorites functionality
- [x] Add favorite toggle API endpoint
- [x] Update images API to filter favorites
- [x] Add album settings integration

#### 5.9 Face Recognition Schema
- [x] Add DetectedFace model
- [x] Add FaceGroup model
- [x] Add DetectedObject model
- [x] Add ImageEmbedding model
- [x] Add UserFavorite model

#### 5.10 PRO Requests Management
- [x] Create /api/admin/requests endpoint
- [x] Create /admin/requests page with Request->Task->Job mapping
- [x] Add quick actions (Start, Complete, Reject, Retry)
- [x] Add comment/notes section
- [x] Add notification on request arrival
- [x] Add requests link to admin navigation
- [x] Add requests tile to admin dashboard

#### 5.11 Password Reset System
- [x] Add reset password link on login page
- [x] Create password reset request API
- [x] Create admin password reset management page
- [x] Create magic link generation and validation
- [x] Create password reset page with validation (6-16 chars, alphanumeric)

#### 5.12 Public Pages
- [x] Create /about page for public access
- [x] Create /help/support page with query form
- [x] Create access request form for anonymous users
- [x] Add About and Help links to homepage navigation

#### 5.13 Testing
- [x] Unit tests for job control logic
- [x] E2E tests with Playwright MCP

---

## PHASE 6 — Intelligence (ML Pipeline)
Status: ⏳ PENDING

### Goals
- Add "intelligence" (ML/AI) to the photo library.
- Enable semantic search and face-based organization.
- Index all images into a vector database for natural language retrieval.

### Tasks

#### 6.1 Face Recognition System
- [ ] Add face recognition toggle to album settings
- [ ] Create AdminTask for face recognition requests
- [ ] Implement face detection job handler
- [ ] Store face embeddings in pgvector
- [ ] Auto-generate face-grouped albums
- [ ] Add pet/venue/object detection options
- [ ] Admin configurable detection parameters

#### 6.2 Object Detection
- [ ] AI object tagging and scene classification
- [ ] Product detection for e-commerce
- [ ] Custom object detection categories

#### 6.3 Vector Search
- [ ] Semantic image embeddings stored in pgvector
- [ ] Text-based semantic search
- [ ] Similar-image search
- [ ] Face similarity search

---

## PHASE 7 — Hardening & Maintenance
Status: ⏳ PENDING

### Goals
- Ensure long-term system stability and data safety.
- Optimize for high-latency or high-pressure storage scenarios.
- Implement robust backup and disaster recovery strategies.

### Tasks

#### 7.1 Security (CRITICAL)
- [ ] **RLS Security on Supabase** - Enable Row Level Security on all public tables
  - `public.Project` - RLS disabled (security issue)
  - `public.Album` - RLS disabled
  - `public.Image` - RLS disabled
  - All other exposed tables need RLS policies
  - Reference: https://supabase.com/docs/guides/auth/row-level-security

#### 7.2 Job Reliability
- [ ] Idempotency keys for jobs
- [ ] Dead-letter queue
- [ ] Disk pressure handling (Vercel `/tmp` limits)
- [ ] Observability (logs, metrics)
- [ ] Vercel Serverless Function optimizations (timeouts, memory)
- [ ] v0 Sync verification (ensure manually added logic isn't broken by UI updates)
- [ ] README + architecture docs polish
- [ ] **Cleanup**: Automated cleanup of failed/stray temp files
- [ ] **Backups**: Database backup strategy
- [ ] **Performance**: Optimization for cloud storage

---

## PHASE 8 — Home Server Integration (FINAL PHASE) ⭐

Status: ⏳ PENDING  
**Prerequisites**: Home server hardware must be ready and configured

### Goals
- Integrate the home server as the final destination for original images.
- Provide long-term, durable storage for lossless originals.
- Enable hybrid cloud + home server architecture.
- Move originals from temporary cloud storage to permanent home server storage.

### Tasks
- [ ] **Home Server Setup**
  - [ ] Install and configure home server hardware
  - [ ] Set up private networking between cloud and home server
  - [ ] Configure secure API endpoints on home server
  - [ ] Set up VPN or tunnel (Tailscale, WireGuard, etc.)
  
- [ ] **Storage API**
  - [ ] Define home server storage API (private network only)
  - [ ] Implement secure upload endpoint on home server
  - [ ] Implement checksum verification endpoint
  - [ ] Set up authentication between cloud and home server
  
- [ ] **Enhanced OFFLOAD_ORIGINAL Handler**
  - [ ] Stream temp file → home server filesystem
  - [ ] Verify checksum after transfer
  - [ ] Implement retry logic with exponential backoff
  - [ ] Handle home server availability issues gracefully
  - [ ] Update image status to STORED after confirmation
  
- [ ] **Sync Monitoring**
  - [ ] Track sync status for each image
  - [ ] Display home server connectivity status in UI
  - [ ] Implement health checks for home server
  - [ ] Alert on sync failures
  
- [ ] **Backup Strategy**
  - [ ] Configure automated backups from home server
  - [ ] Set up redundant storage (RAID, backup drives)
  - [ ] Test disaster recovery procedures

### Notes
- This phase is intentionally deferred to allow the system to be fully functional
  in the cloud environment first.
- Originals remain in temporary storage during Phases 2-7.
- Once implemented, images will flow: INGESTED → PROCESSING → PROCESSED → STORED (home server)
- The system is designed to work without home server integration (Phase 8 is optional).

---

## UPDATED Image Lifecycle (Phases 1-7)

```
UPLOADED
  ↓
INGESTED (temporary cloud storage)
  ↓
PROCESSING (background asset generation)
  ├─→ Thumbnail generation
  ├─→ Preview generation  
  ├─→ EXIF enrichment
  └─→ All jobs complete
      ↓
  PROCESSED (all assets ready in cloud)
```

## COMPLETE Image Lifecycle (With Phase 8)

```
UPLOADED
  ↓
INGESTED (temporary cloud storage)
  ↓
PROCESSING (background asset generation)
  ├─→ Thumbnail generation
  ├─→ Preview generation
  ├─→ EXIF enrichment
  └─→ All jobs complete
      ↓
  PROCESSED (all assets ready in cloud)
      ↓
  [Phase 8: Home Server Integration]
  STORED (original moved to home server)
```

---

## RULES
- Feature velocity is secondary to system design correctness.
- **Never** buffer large files; always stream.
- Jobs must be idempotent and survive server restarts.
- Phase 8 (Home Server) is optional - the system works without it.
- All phases 2-7 must function independently of home server availability.
