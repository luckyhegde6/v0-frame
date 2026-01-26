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
- [x] Standardized AI configuration ([.ai/](file:///f:/Local_git/v0-frame/.ai/))

This phase validates UX direction, deployment pipeline, and AI autonomy foundation.

---

## PHASE 1 — Image Ingestion Foundation (CRITICAL)

Status: ⏳ IN PROGRESS

> [!IMPORTANT]
> **All Phase 1 work must comply with the authoritative Phase 1 Ingestion Contracts.**  
> See: [`.ai/contracts/phase-1-ingestion.md`](file:///.ai/contracts/phase-1-ingestion.md)

### Goals
Establish a correct, explicit image lifecycle.
No ML. No optimizations. No shortcuts.

### Tasks
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
- [ ] **Validate implementation against contract checklist (§13)** (Requires running code)

### Non-goals
- No face detection
- No object detection
- No pgvector
- No thumbnails yet
- No home server storage (Phase 2)
- No compression (Phase 3)
- No ML (Phase 4)

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
- [ ] Disk pressure handling (Vercel `/tmp` limits)
- [ ] Observability (logs, metrics)
- [ ] Vercel Serverless Function optimizations (timeouts, memory)
- [ ] v0 Sync verification (ensure manually added logic isn't broken by UI updates)
- [ ] README + architecture docs polish

---

## RULES

- Do NOT skip phases
- Do NOT mix concerns
- Do NOT store originals in cloud
- Prefer boring, explicit solutions
