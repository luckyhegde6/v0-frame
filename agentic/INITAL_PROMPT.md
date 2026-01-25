You are a senior staff engineer designing and implementing a production-grade,
hybrid photo management platform similar to Google Photos.

The system uses a cloud/serverless frontend and a private home server
for durable storage and heavy ML processing.

====================================================
CORE TECHNOLOGY STACK
====================================================
- Next.js (App Router, TypeScript) deployed on Vercel
- Prisma ORM
- PostgreSQL with pgvector (hosted on home server)
- Temporary cloud filesystem for ingestion (ephemeral)
- Home server filesystem as source-of-truth storage
- Sharp for image processing
- Background async jobs (queue-based, idempotent)
- Secure private networking between cloud and home server

====================================================
ARCHITECTURAL PRINCIPLES
====================================================
1. Cloud servers are stateless and disposable
2. Home server is the canonical data store
3. Upload, offload, processing, and querying are fully decoupled
4. All long-running tasks are asynchronous and retry-safe
5. Originals are immutable and lossless
6. Cloud stores only derived, disposable assets
7. All streaming operations are backpressure-aware
8. Failures are expected and handled explicitly

====================================================
REQUIRED FEATURES
====================================================
1. Image upload to cloud server with temporary storage
2. Async offload of original image to home server filesystem
3. Checksum verification before deleting cloud temp files
4. Generation of compressed previews (JPEG/PNG, smallest size)
5. Generation of thumbnails for gallery views
6. Background ML pipeline on home server:
   - EXIF extraction
   - Face detection with bounding boxes + embeddings
   - Object & scene detection with confidence scores
   - Semantic image embeddings stored in pgvector
7. Gallery view uses thumbnails only
8. Image detail view uses compressed previews
9. Full-resolution originals fetched only on explicit download
10. Grouped downloads streamed as ZIP (no buffering)
11. Clear image lifecycle states with retries and failure tracking

====================================================
PHASED DEVELOPMENT PLAN (MANDATORY)
====================================================

PHASE 0 — SYSTEM DESIGN ONLY
- Architecture diagram (described)
- Data flow explanation
- Failure modes and recovery strategies
(No code yet)

PHASE 1 — BAREBONES IMPLEMENTATION
- Next.js app skeleton
- Prisma schema
- Minimal upload API
- Temporary filesystem ingestion
- Stub async job queue (in-memory or simple worker)
- No ML, no thumbnails yet

PHASE 2 — STORAGE OFFLOAD
- Home server storage API
- Async offload job
- Checksum validation
- Cloud temp file cleanup
- Status transitions

PHASE 3 — IMAGE DERIVATIVES
- Thumbnail generation
- Compressed preview generation
- Gallery UI using thumbnails only

PHASE 4 — ML PIPELINE (HOME SERVER)
- Face detection
- Object/scene detection
- Embedding generation
- pgvector persistence

PHASE 5 — SEARCH & DOWNLOADS
- Semantic search
- Grouped ZIP streaming downloads
- Access control

PHASE 6 — HARDENING
- Idempotency
- Retries & backoff
- Observability
- Disk pressure handling
- Graceful degradation

====================================================
OUTPUT FORMAT
====================================================
For the CURRENT PHASE ONLY, produce:
1. Design explanation
2. Folder structure
3. Key interfaces and contracts
4. Minimal but correct code skeleton
5. Explicit TODOs for next phase

====================================================
CONSTRAINTS
====================================================
- Do NOT use toy examples
- Do NOT collapse phases
- Do NOT introduce unnecessary abstractions
- Assume millions of images
- Assume intermittent home server availability
- Code must be production-grade and extensible

Start with PHASE 0.

## 🔹 EXPECTED BAREBONES STRUCTURE (Phase 1 Output)
When you move to Phase 1, this is roughly the minimum acceptable repo layout.
```
/app
  /api
    /images
      route.ts          # upload + list
  /gallery
    page.tsx            # thumbnail-only view
  layout.tsx
  page.tsx

/lib
  db.ts                 # Prisma client
  storage
    temp.ts             # temp file handling
  jobs
    queue.ts            # job enqueue abstraction
  image
    metadata.ts         # EXIF parsing (lightweight)

/prisma
  schema.prisma

/workers
  offload.worker.ts     # async job stub

/public
  /thumbnails           # cloud-derived assets only

/scripts
  cleanup-temp.ts       # TTL-based cleanup
```

## HOW TO USE THIS IN PRACTICE
- Run PHASE 0 → write the design doc
- Commit only that
- Run PHASE 1 → get skeleton
- Implement + adjust
- Move one phase at a time

This mimics real engineering org workflows.