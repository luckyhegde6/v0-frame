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

Status: ⏳ IN PROGRESS

> [!IMPORTANT]
> **Phase 2 now focuses on cloud/local asset processing only.**
> Home Server offload has been moved to Phase 8.
> All processing happens in the cloud/temporary storage environment.

### Goals
- Automatically generate web-optimized previews and thumbnails for all ingested images.
- Improve gallery UX by loading optimized assets instead of originals.
- Establish robust background job processing infrastructure.
- Preserve lossless originals in temporary storage while providing a snappy interface.

### Tasks
- [ ] **Job Runner Infrastructure**
  - [ ] Database-backed job persistence
  - [ ] Advisory locking mechanism
  - [ ] Retry logic with exponential backoff
  - [ ] Polling loop with configurable batch size
  - [ ] Error handling and dead letter queue
  
- [ ] **OFFLOAD_ORIGINAL Handler (Simplified)**
  - [ ] Skip actual file movement (no home server yet)
  - [ ] Mark image as PROCESSING state
  - [ ] Enqueue derived asset generation jobs
  - [ ] Keep temp file in place (will move in Phase 8)
  
- [ ] **THUMBNAIL_GENERATION Handler**
  - [ ] Generate multiple thumbnail sizes (64, 128, 256, 512px)
  - [ ] Store in deterministic paths
  - [ ] Use Sharp for high-quality resizing
  
- [ ] **PREVIEW_GENERATION Handler**
  - [ ] Generate web-optimized preview (max 2000px)
  - [ ] JPEG quality 85 with progressive encoding
  - [ ] Store in deterministic path
  
- [ ] **EXIF_ENRICHMENT Handler**
  - [ ] Extract full EXIF metadata
  - [ ] Parse GPS coordinates
  - [ ] Extract camera/lens information
  - [ ] Store in database
  
- [ ] **Gallery Integration**
  - [ ] Update UI to load thumbnails/previews
  - [ ] Add processing status indicators
  - [ ] Implement polling for processing updates
  
- [ ] **Admin APIs**
  - [ ] `GET /api/admin/jobs` - List jobs with filtering
  - [ ] `GET /api/admin/jobs/:id` - View job details

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
Status: ⏳ IN PROGRESS

### Goals
- Enable organizational groupings (Projects) for professional photography workflows.
- Implement secure, time-limited sharing mechanisms for clients.
- Provide storage management and quota enforcement.

### Tasks
- [ ] **Database Schema**
  - [x] Project model with quota management
  - [x] ProjectImage join table
  - [x] ShareToken model for client sharing
- [ ] **Project Management**
  - [ ] Create/Update/Delete projects
  - [ ] List user projects with pagination
- [ ] **Project Images**
  - [ ] Add/remove images from projects
  - [ ] Project-scoped image queries
- [ ] **Sharing**
  - [ ] Generate share tokens
  - [ ] Share token expiry and access limits
  - [ ] Public share view page
- [ ] **Quotas**
  - [ ] Storage usage tracking
  - [ ] Quota enforcement on upload
  - [ ] Quota display in UI

---

## PHASE 5 — Admin Control Plane
Status: ⏳ PENDING

### Goals
- Provide a centralized dashboard for system observability and management.
- Expose interactive API documentation (Swagger) for ecosystem growth.
- Monitor server health, job queues, and hardware statistics.

### Tasks
- [ ] **Dashboard**: centralized UI for system health and job status
- [ ] **Swagger**: Interactive API documentation
- [ ] **Analytics**: Server stats, disk usage, and processing metrics
- [ ] **Manual Job Control**: Retry, cancel, and monitor jobs

---

## PHASE 6 — Intelligence (ML Pipeline)
Status: ⏳ PENDING

### Goals
- Add "intelligence" (ML/AI) to the photo library.
- Enable semantic search and face-based organization.
- Index all images into a vector database for natural language retrieval.

### Tasks
- [ ] **Faces**: Face detection and face-grouping jobs
- [ ] **Objects**: AI object tagging and scene classification
- [ ] **Vectors**: Semantic image embeddings stored in pgvector
- [ ] **Search**: Text-based semantic search
- [ ] **Similarity**: Similar-image search

---

## PHASE 7 — Hardening & Maintenance
Status: ⏳ PENDING

### Goals
- Ensure long-term system stability and data safety.
- Optimize for high-latency or high-pressure storage scenarios.
- Implement robust backup and disaster recovery strategies.

### Tasks
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
