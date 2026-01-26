# Phase 1 — Ingestion Contracts (Authoritative)

**Status**: AUTHORITATIVE  
**Version**: 1.0.0  
**Phase**: 1 - Image Ingestion Foundation  
**Last Updated**: 2026-01-25

---

> [!CAUTION]
> This document defines the **authoritative contract** for Phase 1 ingestion.
> 
> **Code that violates this contract is wrong, even if it works.**
> 
> All agents, implementations, and reviews must reference and comply with this specification.

---

## Document Purpose

This is **truth-first**, not code-first.

This contract is:
- **Explicit**: No ambiguity allowed
- **Boring**: Proven patterns only
- **Enforceable**: Clear pass/fail criteria
- **Hostile to ambiguity**: Every detail specified

## Scope of Phase 1

### ✅ Phase 1 ONLY Covers

1. **Accepting image uploads**
2. **Temporary cloud persistence**
3. **Metadata capture** (basic only)
4. **Job enqueue for offload**
5. **Explicit lifecycle transitions**

### ❌ Phase 1 EXPLICITLY Excludes

The following are **FORBIDDEN** in Phase 1:

- ❌ Home server storage (Phase 2)
- ❌ Thumbnails (Phase 3)
- ❌ Compression (Phase 3)
- ❌ ML processing (Phase 4)
- ❌ pgvector (Phase 4)
- ❌ Search (Phase 5)
- ❌ Optimization (Phase 5+)

**Any agent introducing excluded concerns is out of phase and must be rejected.**

---

## 1. Canonical Image Lifecycle (Phase 1 Subset)

### Legal States

Only the following states are legal in Phase 1:

\`\`\`
UPLOADED   → File received, bytes transferred
INGESTED   → Temp file written + metadata stored
FAILED     → Unrecoverable ingestion error
\`\`\`

### State Transition Rules

1. **No other states may be introduced**
2. **No state may be skipped**
3. **No state may be inferred**
4. **State transitions must be explicit and persisted**

### State Definitions

#### UPLOADED
- **Meaning**: Client finished sending bytes
- **Duration**: Milliseconds (in-flight)
- **Location**: Network stream
- **Next States**: `INGESTED`, `FAILED`

#### INGESTED
- **Meaning**: Temp file safely written + metadata stored in DB
- **Duration**: Minutes to hours (until Phase 2 offload)
- **Location**: Cloud temporary storage
- **Next States**: None in Phase 1 (Phase 2 will add `STORED`)

#### FAILED
- **Meaning**: Unrecoverable ingestion error
- **Duration**: Until manual intervention or retry
- **Location**: Depends on failure point
- **Next States**: `UPLOADED` (retry from beginning)

### Transition Validation

\`\`\`typescript
// MANDATORY: Validate all transitions
const PHASE_1_TRANSITIONS: Record<ImageStatus, ImageStatus[]> = {
  UPLOADED: ['INGESTED', 'FAILED'],
  INGESTED: [], // Terminal in Phase 1
  FAILED: ['UPLOADED'], // Retry
};

function validateTransition(from: ImageStatus, to: ImageStatus): void {
  const allowed = PHASE_1_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new Error(
      `Invalid Phase 1 transition: ${from} → ${to}. ` +
      `Allowed: ${allowed.join(', ')}`
    );
  }
}
\`\`\`

---

## 2. Upload API Contract (Hard Boundary)

### Endpoint

\`\`\`
POST /api/upload
\`\`\`

### Responsibilities (MANDATORY)

The upload handler must do **all and only** the following:

1. ✅ Accept a streamed file upload
2. ✅ Persist file to temporary storage
3. ✅ Compute checksum (SHA-256)
4. ✅ Extract basic metadata only (see §4)
5. ✅ Create a DB record
6. ✅ Enqueue an offload job
7. ✅ Return an immutable response

**Anything else is forbidden.**

### Explicitly Forbidden in Upload API

The upload handler **MUST NOT**:

- ❌ Perform compression
- ❌ Perform resizing
- ❌ Perform thumbnail generation
- ❌ Call the home server
- ❌ Perform ML
- ❌ Block on async jobs
- ❌ Mutate files after persistence
- ❌ Parse EXIF beyond header-safe reads
- ❌ Perform any "smart" processing

**Violation = contract breach.**

### Request Format

\`\`\`typescript
// Multipart form data
Content-Type: multipart/form-data

{
  file: File // Single image file
}
\`\`\`

### Response Format

\`\`\`typescript
// Success (201 Created)
{
  imageId: string;      // Unique identifier
  status: "INGESTED";   // Always INGESTED on success
  checksum: string;     // SHA-256 hash
  sizeBytes: number;    // File size
  uploadedAt: string;   // ISO 8601 timestamp
}

// Error (4xx/5xx)
{
  error: string;        // Human-readable error
  code: string;         // Machine-readable error code
}
\`\`\`

### Implementation Template

\`\`\`typescript
export async function POST(request: Request) {
  try {
    // 1. Accept streamed upload
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // 2. Validate file
    validateImageFile(file);
    
    // 3. Generate image ID
    const imageId = generateImageId();
    
    // 4. Stream to temp storage
    const tempPath = await streamToTempStorage(imageId, file);
    
    // 5. Compute checksum
    const checksum = await computeChecksum(tempPath);
    
    // 6. Extract basic metadata
    const metadata = await extractBasicMetadata(tempPath);
    
    // 7. Create DB record
    const image = await createImageRecord({
      id: imageId,
      status: 'INGESTED',
      tempPath,
      checksum,
      ...metadata,
    });
    
    // 8. Enqueue offload job
    await enqueueOffloadJob({
      type: 'OFFLOAD_ORIGINAL',
      imageId,
      tempPath,
      checksum,
    });
    
    // 9. Return response
    return Response.json({
      imageId: image.id,
      status: image.status,
      checksum: image.checksum,
      sizeBytes: image.sizeBytes,
      uploadedAt: image.createdAt.toISOString(),
    }, { status: 201 });
    
  } catch (error) {
    // Error handling per §7
    return handleUploadError(error);
  }
}
\`\`\`

---

## 3. Temporary Storage Contract

### Definition

Temporary storage is:

- **Ephemeral**: Can be deleted at any time
- **Non-durable**: Not backed up
- **Automatically cleaned**: TTL-based cleanup
- **Not a source of truth**: Home server is canonical

### Guarantees Required

1. **File write must be atomic**
   - Use temp file + rename pattern
   - No partial writes visible

2. **File path must be deterministic**
   - Same imageId = same path
   - Enables idempotent operations

3. **File must survive process crashes**
   - Until TTL-based cleanup
   - Not tied to process lifecycle

4. **Cleanup must be TTL-based**
   - Not immediate after offload
   - Grace period for retries

### Naming Convention (MANDATORY)

\`\`\`
/tmp/ingest/{imageId}.{ext}
\`\`\`

**Rules**:
- No randomness
- No UUID soup
- Extension matches original file
- Deterministic from imageId

**Example**:
\`\`\`
/tmp/ingest/img_2026-01-25_abc123.jpg
/tmp/ingest/img_2026-01-25_def456.png
\`\`\`

### Cleanup Policy

\`\`\`typescript
// TTL: 24 hours after creation
const TEMP_FILE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup runs every hour
setInterval(async () => {
  const cutoff = Date.now() - TEMP_FILE_TTL;
  await cleanupTempFiles(cutoff);
}, 60 * 60 * 1000);
\`\`\`

---

## 4. Metadata Contract (Phase 1 Only)

### Allowed Metadata

Only the following metadata may be extracted in Phase 1:

| Field | Source | Type | Required |
|-------|--------|------|----------|
| `fileSize` | Upload stream | number | ✅ |
| `mimeType` | Upload headers | string | ✅ |
| `width` | Image header | number | ✅ |
| `height` | Image header | number | ✅ |
| `checksum` | Computed (SHA-256) | string | ✅ |
| `uploadedAt` | Server timestamp | Date | ✅ |

### Explicitly Forbidden

- ❌ EXIF parsing beyond header-safe reads
- ❌ Geolocation extraction
- ❌ Camera model enrichment
- ❌ Color profile analysis
- ❌ Face detection
- ❌ Object detection
- ❌ Any ML-derived metadata

**Agents must not speculate future metadata needs.**

### Extraction Implementation

\`\`\`typescript
interface BasicMetadata {
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
}

async function extractBasicMetadata(filePath: string): Promise<BasicMetadata> {
  // Use Sharp for header-only reads
  const image = sharp(filePath);
  const metadata = await image.metadata();
  
  return {
    mimeType: `image/${metadata.format}`,
    width: metadata.width!,
    height: metadata.height!,
    sizeBytes: (await fs.stat(filePath)).size,
  };
}
\`\`\`

---

## 5. Database Record Contract

### Image Record MUST Contain

\`\`\`typescript
interface ImageRecord {
  id: string;              // Unique identifier
  status: 'INGESTED';      // Always INGESTED in Phase 1
  tempPath: string;        // Absolute path to temp file
  checksum: string;        // SHA-256 hash
  mimeType: string;        // e.g., "image/jpeg"
  width: number;           // Image width in pixels
  height: number;          // Image height in pixels
  sizeBytes: number;       // File size in bytes
  createdAt: Date;         // Upload timestamp
  updatedAt: Date;         // Last update timestamp
}
\`\`\`

### Rules

1. **`tempPath` is required**
   - Must be absolute path
   - Must be deterministic

2. **`status` must be `INGESTED` at end of request**
   - No other status allowed in Phase 1

3. **No nullable "maybe later" fields**
   - All fields required
   - No optional metadata

4. **No JSON blobs**
   - Structured fields only
   - Type-safe schema

### Prisma Schema (Phase 1)

\`\`\`prisma
model Image {
  id        String   @id @default(cuid())
  status    String   // "INGESTED" or "FAILED"
  tempPath  String   // Absolute path
  checksum  String   @unique // SHA-256
  mimeType  String   // MIME type
  width     Int      // Pixels
  height    Int      // Pixels
  sizeBytes Int      // Bytes
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([status])
  @@index([checksum])
  @@index([createdAt])
}
\`\`\`

---

## 6. Job Enqueue Contract (Offload Stub)

### Job Type (Phase 1 Only)

\`\`\`typescript
type OffloadJob = {
  type: 'OFFLOAD_ORIGINAL';
  imageId: string;
  tempPath: string;
  checksum: string;
};
\`\`\`

### Rules

1. **Job enqueue is fire-and-forget**
   - Upload request must NOT wait for job execution
   - Job runs asynchronously

2. **Job creation failure = upload failure**
   - If enqueue fails, entire upload fails
   - Cleanup temp file on failure

3. **Job execution is out of scope for Phase 1**
   - Worker implementation is Phase 2
   - Phase 1 only enqueues

### Implementation Stub

\`\`\`typescript
// Phase 1: Enqueue only
async function enqueueOffloadJob(job: OffloadJob): Promise<void> {
  // TODO: Implement actual queue in Phase 2
  // For now, just log
  console.log('[Phase 1] Offload job enqueued:', job);
  
  // Store job in DB for Phase 2
  await prisma.job.create({
    data: {
      type: job.type,
      payload: JSON.stringify(job),
      status: 'PENDING',
    },
  });
}
\`\`\`

---

## 7. Error Handling Contract

### Upload Errors

| Failure | Required Action |
|---------|----------------|
| Stream error | Abort + no DB write |
| Temp write failure | Abort + cleanup |
| Checksum failure | Abort + cleanup |
| DB failure | Cleanup temp |
| Job enqueue failure | Cleanup temp + rollback DB |

**No partial success states allowed.**

### Error Response Format

\`\`\`typescript
interface ErrorResponse {
  error: string;        // Human-readable message
  code: string;         // Machine-readable code
  details?: unknown;    // Optional debug info (dev only)
}

// Error codes
const ERROR_CODES = {
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  STREAM_ERROR: 'STREAM_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  CHECKSUM_ERROR: 'CHECKSUM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  JOB_ENQUEUE_ERROR: 'JOB_ENQUEUE_ERROR',
} as const;
\`\`\`

### Error Handling Implementation

\`\`\`typescript
async function handleUploadError(error: unknown): Promise<Response> {
  // Log error
  console.error('[Upload Error]', error);
  
  // Determine error type
  let code: string;
  let message: string;
  let status: number;
  
  if (error instanceof ValidationError) {
    code = ERROR_CODES.INVALID_FILE_TYPE;
    message = error.message;
    status = 400;
  } else if (error instanceof StorageError) {
    code = ERROR_CODES.STORAGE_ERROR;
    message = 'Failed to store file';
    status = 500;
  } else {
    code = 'UNKNOWN_ERROR';
    message = 'An unexpected error occurred';
    status = 500;
  }
  
  return Response.json({ error: message, code }, { status });
}
\`\`\`

---

## 8. Idempotency Contract

### Upload API

**NOT idempotent**

- Each request creates a new image
- Same file uploaded twice = two records
- Client must handle deduplication if needed

### Jobs

**MUST be idempotent**

- Safe to retry
- Must check DB state before acting
- Use checksum for deduplication

\`\`\`typescript
// Job must be idempotent
async function processOffloadJob(job: OffloadJob): Promise<void> {
  // Check if already processed
  const image = await prisma.image.findUnique({
    where: { id: job.imageId },
  });
  
  if (image.status !== 'INGESTED') {
    // Already processed or failed
    return;
  }
  
  // Process job...
}
\`\`\`

**Agents must not blur these semantics.**

---

## 9. Observability Contract (Minimal)

### Required Logging

Each upload MUST log:

1. **imageId**: Unique identifier
2. **tempPath**: Where file was stored
3. **checksum**: SHA-256 hash
4. **status transition**: UPLOADED → INGESTED
5. **duration**: Time taken for upload

### Log Format

\`\`\`typescript
console.log('[Upload]', {
  imageId,
  tempPath,
  checksum,
  status: 'INGESTED',
  sizeBytes,
  durationMs,
  timestamp: new Date().toISOString(),
});
\`\`\`

**No structured logging yet — just consistency.**

---

## 10. Explicit Non-Goals (Repeat This to Agents)

Phase 1 is **NOT** about:

- ❌ Performance
- ❌ Scale
- ❌ Intelligence
- ❌ UX polish
- ❌ Optimization
- ❌ Advanced features

Phase 1 **IS** about:

- ✅ **Correct ingestion**
- ✅ **Explicit contracts**
- ✅ **Data safety**
- ✅ **Clear boundaries**

---

## 11. Agent Safety Clause (Critical)

### Rejection Criteria

If an agent:

1. ❌ Adds fields not defined here
2. ❌ Adds states not defined here
3. ❌ Adds processing not defined here
4. ❌ Moves work into the upload handler
5. ❌ Introduces excluded concerns (thumbnails, ML, etc.)

**That output must be rejected. No exceptions.**

### Agent Checklist

Before accepting agent output, verify:

- [ ] Only Phase 1 states used
- [ ] Only Phase 1 metadata extracted
- [ ] No excluded processing
- [ ] Upload handler does only 7 required tasks
- [ ] Error handling follows contract
- [ ] Idempotency rules followed
- [ ] Logging is consistent

---

## 12. How to Reference This (Important)

### In Agent Prompts

Every agent prompt must include:

\`\`\`
All output must comply with Phase 1 Ingestion Contracts.
See: .ai/contracts/phase-1-ingestion.md
\`\`\`

### In Code Reviews

Every code review must verify:

\`\`\`
Does this code comply with Phase 1 Ingestion Contracts?
Reference: .ai/contracts/phase-1-ingestion.md
\`\`\`

### In TODO.md

Phase 1 tasks must reference:

\`\`\`
- [ ] Implement upload API per Phase 1 Ingestion Contracts
      See: .ai/contracts/phase-1-ingestion.md
\`\`\`

### In AGENT_RULES.md

Add reference:

\`\`\`
Phase 1 work must comply with:
.ai/contracts/phase-1-ingestion.md
\`\`\`

---

## 13. Validation Checklist

### Implementation Validation

- [ ] Upload API does exactly 7 required tasks
- [ ] Only Phase 1 states used (UPLOADED, INGESTED, FAILED)
- [ ] Only Phase 1 metadata extracted (6 fields)
- [ ] Temp storage uses deterministic naming
- [ ] DB record has all required fields
- [ ] Job enqueue is fire-and-forget
- [ ] Error handling follows contract
- [ ] No excluded processing (thumbnails, ML, etc.)
- [ ] Logging is consistent
- [ ] Idempotency rules followed

### Agent Output Validation

- [ ] No new states introduced
- [ ] No new metadata fields
- [ ] No processing beyond contract
- [ ] No blocking on async work
- [ ] No optimization attempts
- [ ] No "smart" features

---

## 14. Contract Versioning

**Version**: 1.0.0  
**Status**: AUTHORITATIVE  
**Last Updated**: 2026-01-25

### Change Policy

This contract may only be changed:

1. With explicit approval
2. With version bump
3. With migration plan
4. With agent notification

**No silent changes allowed.**

---

## Appendix A: Complete Type Definitions

\`\`\`typescript
// Image statuses (Phase 1 only)
type ImageStatus = 'UPLOADED' | 'INGESTED' | 'FAILED';

// Image record
interface ImageRecord {
  id: string;
  status: ImageStatus;
  tempPath: string;
  checksum: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
}

// Offload job
interface OffloadJob {
  type: 'OFFLOAD_ORIGINAL';
  imageId: string;
  tempPath: string;
  checksum: string;
}

// Upload response
interface UploadResponse {
  imageId: string;
  status: 'INGESTED';
  checksum: string;
  sizeBytes: number;
  uploadedAt: string;
}

// Error response
interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}
\`\`\`

---

**END OF CONTRACT**

This document is authoritative. Code that violates this contract is wrong.
