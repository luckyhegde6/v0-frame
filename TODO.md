# TODO — Photo Management System (FRAME)

This file defines the execution roadmap for FRAME.
Work MUST proceed in phases. The single source of truth is the Home Server.
The goal is not feature velocity — it is system correctness,
reliability, and long-term maintainability.

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
- [x] **Storage**: Implement streaming file storage on the home server
- [x] **Upload API**: Contract-compliant implementation (streaming, metadata extraction, checksum)
- [x] **Jobs**: Job enqueue logic (stubbed/basic)

---

## PHASE 2 — Job Runner and Home Server Offload (SOURCE OF TRUTH)

Status: ⏳ IN PROGRESS

> [!IMPORTANT]
> **All Phase 1 work must comply with the authoritative Phase 1 Ingestion Contracts.**  
> See: [`.ai/contracts/phase-1-ingestion.md`](./.ai/contracts/phase-1-ingestion.md)

### Goals
- Automatically generate web-optimized previews and thumbnails for all ingested images.
- Improve gallery UX by loading optimized assets instead of originals.
- Preserve lossless originals while providing a snappy interface.

### Tasks
- [ ] **Metadata**: Implement full EXIF metadata extraction job
- [ ] **Thumbnails**: Background thumbnail generation (multiple sizes)
- [ ] **Previews**: Compressed preview generation (web-optimized)
- [ ] **Gallery**: Update UI to load derived assets preferentially
- [ ] Define home server storage API (private network only)
- [ ] Implement async offload worker
- [ ] Stream temp file → home filesystem
- [ ] Verify checksum before delete
- [ ] Delete temp file only after confirmation
- [ ] Handle retries and backoff
- [ ] Update image status to STORED

---

## PHASE 3 — Auth & Access Control
Status: ⏳ PENDING

### Goals
- Secure the platform with robust authentication and granular RBAC (Role Based Access Control).
- Ensure resource-level isolation (users only see their own images).
- Protect the filesystem and administrative APIs.

### Tasks
- [ ] EXIF enrichment
- [ ] Face detection (bbox + embeddings)
- [ ] Object & scene detection
- [ ] Semantic image embeddings
- [ ] Persist vectors in pgvector
- [ ] Status transition to PROCESSED
- [ ] Generate thumbnails (multiple sizes)
- [ ] Generate compressed preview (JPEG/PNG)
- [ ] Store derived assets in cloud
- [ ] Gallery loads thumbnails only
- [ ] Image detail loads preview only
- [ ] Explicit “Download Original” action
- [ ] **Roles**: Implement USER / PRO / CLIENT / ADMIN role model
- [ ] **Auth**: Integrate session management (NextAuth or custom provider)
- [ ] **Isolation**: Route-level and resource-level access control

---

## PHASE 4 — Professional Projects
Status: ⏳ PENDING

### Goals
- Enable organizational groupings (Projects) for professional photography workflows.
- Implement secure, time-limited sharing mechanisms for clients.
- Provide storage management and quota enforcement.

### Tasks
- [ ] **Namespacing**: Logical project groupings for images
- [ ] **Sharing**: Secure client sharing links with expiry
- [ ] **Quotas**: Per-user/project storage management

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

---

## PHASE 6 — Intelligence (Home Server Only)
Status: ⏳ PENDING

### Goals
- Add "intelligence" (ML/AI) to the photo library without cloud dependencies.
- Enable semantic search and face-based organization.
- Index all images into a vector database for natural language retrieval.

### Tasks
- [ ] **Faces**: Face detection and face-grouping jobs
- [ ] **Objects**: AI object tagging and scene classification
- [ ] **Vectors**: Semantic image embeddings stored in pgvector
- [ ] Text-based semantic search
- [ ] Similar-image search
- [ ] Filter by tags, faces, date
- [ ] Grouped downloads
- [ ] ZIP streaming (no buffering)

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
- [ ] **Backups**: Database and original image backup strategy
- [ ] **Performance**: Optimization for high-latency storage (HDD support)

---

## RULES
- The Home Server is the absolute system of record.
- **Never** buffer large files; always stream.
- Jobs must be idempotent and survive server restarts.
- Feature velocity is secondary to system design correctness.
