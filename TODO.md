# TODO — Photo Management System (FRAME)

This file defines the execution roadmap for FRAME.
Work MUST proceed in phases. Do not skip phases.

The goal is not feature velocity — it is system correctness,
reliability, and long-term maintainability.

---

## PHASE 0 — Current State (Baseline)

Status: ✅ COMPLETE

- [x] Next.js App Router scaffold
- [x] Landing page
- [x] Upload UI (drag & drop)
- [x] Gallery UI
- [x] Image detail modal
- [x] Vercel deployment
- [x] Basic metadata display (size, format, dimensions)

This phase validates UX direction and deployment pipeline.

---

## PHASE 1 — Image Ingestion Foundation (CRITICAL)

Status: ⏳ IN PROGRESS

### Goals
Establish a correct, explicit image lifecycle.
No ML. No optimizations. No shortcuts.

### Tasks
- [ ] Define ImageStatus enum (UPLOADED → INGESTED → STORED → PROCESSED)
- [ ] Introduce Prisma schema for Image records
- [ ] Implement temporary file storage on server (ephemeral)
- [ ] Refactor `/api/upload` to:
  - accept streams
  - save to temp
  - create DB record
  - enqueue offload job
- [ ] Add checksum calculation (SHA-256)
- [ ] Ensure temp files are NOT treated as durable

### Non-goals
- No face detection
- No object detection
- No pgvector
- No thumbnails yet

---

## PHASE 2 — Home Server Offload (SOURCE OF TRUTH)

Status: ⏳ PENDING

### Goals
Move original images to home server safely and deterministically.

### Tasks
- [ ] Define home server storage API (private network only)
- [ ] Implement async offload worker
- [ ] Stream temp file → home filesystem
- [ ] Verify checksum before delete
- [ ] Delete temp file only after confirmation
- [ ] Handle retries and backoff
- [ ] Update image status to STORED

---

## PHASE 3 — Derived Assets & Gallery Optimization

Status: ⏳ PENDING

### Goals
Improve UX without touching originals.

### Tasks
- [ ] Generate thumbnails (multiple sizes)
- [ ] Generate compressed preview (JPEG/PNG)
- [ ] Store derived assets in cloud
- [ ] Gallery loads thumbnails only
- [ ] Image detail loads preview only
- [ ] Explicit “Download Original” action

---

## PHASE 4 — Background ML Pipeline (Home Server)

Status: ⏳ PENDING

### Goals
Add intelligence without coupling to UI.

### Tasks
- [ ] EXIF enrichment
- [ ] Face detection (bbox + embeddings)
- [ ] Object & scene detection
- [ ] Semantic image embeddings
- [ ] Persist vectors in pgvector
- [ ] Status transition to PROCESSED

---

## PHASE 5 — Search & Retrieval

Status: ⏳ PENDING

### Tasks
- [ ] Text-based semantic search
- [ ] Similar-image search
- [ ] Filter by tags, faces, date
- [ ] Grouped downloads
- [ ] ZIP streaming (no buffering)

---

## PHASE 6 — Hardening & Maintenance

Status: ⏳ PENDING

### Tasks
- [ ] Idempotency keys for jobs
- [ ] Dead-letter queue
- [ ] Disk pressure handling
- [ ] Observability (logs, metrics)
- [ ] README + architecture docs polish

---

## RULES

- Do NOT skip phases
- Do NOT mix concerns
- Do NOT store originals in cloud
- Prefer boring, explicit solutions
