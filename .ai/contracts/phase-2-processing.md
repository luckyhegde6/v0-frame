# Phase 2 — Processing & Job Runner Contracts (Authoritative)

**Status**: AUTHORITATIVE  
**Version**: 2.0.0  
**Phase**: 2 – Job Runner & Local Processing  
**Last Updated**: 2026-02-15

> [!IMPORTANT]
> **MAJOR CHANGE**: Home server integration has been moved to Phase 8.
> Phase 2 now focuses exclusively on cloud/temporary storage processing.
> Original files remain in temp storage until Phase 8.

---

> [!CAUTION]
> Phase 2 defines **HOW work executes**, not **WHAT intelligence exists**.
> 
> Code that performs processing outside the job system is **invalid**.

---

## Document Purpose

Phase 2 establishes:
- Persistent background execution
- Job safety across restarts
- Idempotent processing
- Admin inspectability
- **Asset generation** (thumbnails, previews, EXIF)

---

## Scope of Phase 2

### ✅ Phase 2 ONLY Covers

1. Job persistence (DB-backed)
2. Job locking and retries
3. **Local/cloud filesystem processing** (temporary storage)
4. Derived assets (thumbnails, previews, EXIF)
5. Cleanup jobs
6. Read-only admin job inspection

### ❌ Phase 2 EXPLICITLY EXCLUDES

- ❌ Authentication & roles
- ❌ Projects / multi-tenancy
- ❌ ML (faces, objects, embeddings)
- ❌ Search
- ❌ Performance optimization
- ❌ **Home server integration** (moved to Phase 8)
- ❌ **Permanent storage** (deferred to Phase 8)

---

## Canonical Image Lifecycle (Phase 2 - Updated)

```
UPLOADED   → File received, bytes transferred
INGESTED   → Temp file written + metadata stored
PROCESSING → Asset generation in progress
PROCESSED  → All derived assets ready
FAILED     → Unrecoverable error
```

### State Transitions (Phase 2 Only)
- INGESTED → PROCESSING → PROCESSED
- FAILED → INGESTED (retry)
- `PROCESSING` is mandatory
- **STORED state deferred to Phase 8**
- Originals remain in temp storage during Phase 2
- Originals are immutable
- State transitions must be persisted

### Full Lifecycle (With Phase 8)
```
UPLOADED → INGESTED → PROCESSING → PROCESSED → [Phase 8] → STORED
```

---

## Job Model Contract
```ts
interface Job {
  id: string;
  type: string;
  payload: unknown;
  status: 'PENDING' | 'RUNNING' | 'FAILED' | 'COMPLETED';
  attempts: number;
  maxAttempts: number;
  lockedAt: Date | null;
  lockedBy: string | null;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Rules:

1. ✅ All jobs must be persisted
2. ✅ Jobs must survive restarts
3. ✅ Jobs must be lock-based
4. ✅ Jobs must be idempotent
5. ✅ Jobs must NOT run in API routes
6. ✅ **Phase 2 jobs operate on temp storage only**

---

## Job Types (Phase 2)

### 1. OFFLOAD_ORIGINAL (Simplified)
**Purpose**: Transition image to PROCESSING state and enqueue derived asset jobs

**Behavior**:
- Skip actual file movement (temp file stays in place)
- Update image status to PROCESSING
- Enqueue THUMBNAIL_GENERATION, PREVIEW_GENERATION, EXIF_ENRICHMENT

**Note**: Full home server offload implemented in Phase 8

### 2. THUMBNAIL_GENERATION
**Purpose**: Generate multiple thumbnail sizes

**Output**: Thumbnails at 64px, 128px, 256px, 512px

### 3. PREVIEW_GENERATION
**Purpose**: Generate web-optimized preview

**Output**: Preview image (max 2000px, JPEG quality 85)

### 4. EXIF_ENRICHMENT
**Purpose**: Extract and store EXIF metadata

**Output**: EXIF data in database

---

## Job Runner Contract

1. ✅ Runs as long-lived Node process
2. ✅ Starts with Next.js server
3. ✅ Pulls jobs from DB
4. ✅ Locks before execution
5. ✅ Unlocks only on completion/failure

### Forbidden

- ❌ In-memory queues
- ❌ setTimeout / cron hacks
- ❌ Request-bound execution

---

## Derived Asset Contract

### Allowed:

1. ✅ Thumbnails (multiple sizes)
2. ✅ Preview image (JPEG/PNG/WebP)
3. ✅ EXIF metadata extraction

### Rules:

1. ✅ Deterministic paths
2. ✅ Safe to regenerate
3. ✅ Re-running jobs must not corrupt data
4. ✅ **Assets stored in cloud temp storage (not home server)**

---

## Admin Job Inspection (Read-Only)

Allowed endpoints:
```
GET /admin/jobs
GET /admin/jobs/:id
```

Forbidden:

- ❌ Manual execution
- ❌ Retry / cancel (Phase 5)

---

## Phase 2 Compliance Checklist

- ✅ Jobs are DB-backed (persistent across restarts)
- ✅ Jobs use advisory locking (DB UPDATE-based)
- ✅ Jobs are retry-capable with exponential backoff
- ✅ Derived assets use deterministic paths
- ✅ All processing happens in job runner (not API routes)
- ✅ **Originals stay in temp storage (Phase 8 will move to home server)**
- ✅ Admin APIs are read-only (no manual execution/retry)
- ✅ Idempotent design (safe to regenerate derived assets)

---

## Agent Rejection Criteria

Reject output if agent:

- Processes images outside job runner
- Touches originals
- Introduces ML
- Uses in-memory queues
- **Implements home server storage (deferred to Phase 8)**
