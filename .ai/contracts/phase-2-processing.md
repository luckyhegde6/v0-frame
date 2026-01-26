# Phase 2 — Processing & Job Runner Contracts (Authoritative)

**Status**: AUTHORITATIVE  
**Version**: 1.0.0  
**Phase**: 2 – Job Runner & Local Processing  
**Last Updated**: 2026-01-26

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

---

## Scope of Phase 2

### ✅ Phase 2 ONLY Covers

1. Job persistence (DB-backed)
2. Job locking and retries
3. Local filesystem processing
4. Derived assets (thumbnails, previews)
5. Cleanup jobs
6. Read-only admin job inspection

### ❌ Phase 2 EXPLICITLY EXCLUDES

- ❌ Authentication & roles
- ❌ Projects / multi-tenancy
- ❌ ML (faces, objects, embeddings)
- ❌ Search
- ❌ Performance optimization

---

## Canonical Image Lifecycle (Phase 2 Extension)

```
UPLOADED   → File received, bytes transferred
INGESTED   → Temp file written + metadata stored
FAILED     → Unrecoverable ingestion error
STORED     → Original file stored in cloud
THUMBNAIL  → Thumbnail generated
PREVIEW    → Preview generated
PROCESSED  → All processing complete
```

- INGESTED → PROCESSING → STORED
- FAILED → INGESTED (retry)
- `PROCESSING` is mandatory
- `STORED` means original + derived assets exist
- Originals are immutable
- State transitions must be persisted

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

### Rules:

1. ✅ Deterministic paths
2. ✅ Safe to regenerate
3. ✅ Re-running jobs must not corrupt data

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

### Agent Rejection Criteria

Reject output if agent:

- Processes images outside job runner
- Touches originals
- Introduces ML
- Uses in-memory queues
