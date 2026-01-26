# Async Patterns

This document defines the patterns for handling asynchronous operations in FRAME.

## Core Principle
**All heavy operations must be asynchronous and decoupled from the request lifecycle.**

api/route -> Job Queue -> Worker -> Result

## 1. Fire-and-Forget
Used for operations where the client doesn't need to wait for the result.

**Example**: Image Offloading
1. Client uploads image.
2. Server saves temp file + DB record.
3. Server enqueues `OFFLOAD` job.
4. Server responds `201 Created`.
5. Worker picks up job later.

## 2. Idempotency
All background jobs must be idempotent. Retrying a job should have the same effect as running it once.

- **Check State**: Before acting, check if work is already done.
- **Atomic Updates**: Use transactions for DB updates.
- **Deduplication**: Use deterministic IDs (e.g., hash of content).

## 3. Retries & Backoff
Failures are expected.

- **Transient Failures** (Network, Timeout): Retry with exponential backoff.
- **Permanent Failures** (Validation, Corruption): Mark as `FAILED`, do not retry automatically.
- **Dead Letter Queue**: After N retries, move to DLQ for manual inspection.

## 4. Job Status Polling
If the client needs to know the result:

1. Client receives `jobId` or `resourceId`.
2. Client polls `/api/jobs/:id` or `/api/resources/:id`.
3. Server returns current status (`PENDING`, `COMPLETED`, `FAILED`).
