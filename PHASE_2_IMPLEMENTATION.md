# Phase 2 Implementation

**Status**: 🔄 UPDATED  
**Date**: 2026-02-15  
**Version**: 2.0.0

> [!IMPORTANT]
> **MAJOR UPDATE**: Home server integration has been moved to Phase 8.
> Phase 2 now focuses exclusively on cloud-based asset processing.
> The OFFLOAD_ORIGINAL handler has been simplified to skip file movement.
> Original files remain in temporary storage until Phase 8.

---

## What Was Implemented

### 1. Database Schema (✅)
- ✅ Extended `Image` model with `PROCESSING` and `STORED` states
- ✅ Added `thumbnailPath` and `previewPath` fields for derived assets
- ✅ Expanded `Job` model with locking, retries, and error tracking
- ✅ Added `JobStatus` enum: PENDING, RUNNING, COMPLETED, FAILED

### 2. Job Runner Service (✅)
- ✅ Created `/lib/jobs/runner.ts` with:
  - Advisory locking mechanism (DB-based, timeout: 30s)
  - Job fetching and processing loop
  - Retry logic with `maxAttempts` (default: 3)
  - Error handling and lock cleanup
  - Batch processing (configurable batch size)

### 3. Job Handlers (✅)
- ✅ **OFFLOAD_ORIGINAL**: Simplified handler - marks image as PROCESSING and enqueues asset jobs (file movement deferred to Phase 8)
- ✅ **THUMBNAIL_GENERATION**: Creates thumbnails at sizes [64, 128, 256, 512]px
- ✅ **PREVIEW_GENERATION**: Creates web-optimized preview (max 2000px, JPEG quality 85)

> [!NOTE]
> The OFFLOAD_ORIGINAL handler no longer moves files to permanent storage.
> It simply transitions the image to PROCESSING state and enqueues derived asset jobs.
> Home server integration is now Phase 8.

### 4. Server Initialization (✅)
- ✅ Created `/lib/server/initialize.ts`
- ✅ Integrated into `/app/layout.tsx`
- ✅ Job runner starts automatically with Next.js server

### 5. Admin APIs (✅)
- ✅ `GET /api/admin/jobs` - List jobs with filtering and pagination
- ✅ `GET /api/admin/jobs/:id` - View job details with retry info

### 6. Updated APIs (✅)
- ✅ `GET /api/images` - Now returns Phase 2 processing status
  - `processingJobs`: Active jobs for the image
  - `isProcessing`: Whether image is in PROCESSING state
  - `isStored`: Whether image is in STORED state
  - Backwards compatible with Phase 1 `isSyncing` flag

### 7. Server Actions (✅)
- ✅ Updated `/app/actions/images.ts` with Phase 2-aware implementations
- ✅ `fetchImages()` - Uses new API endpoint
- ✅ `uploadImage()` - Calls `/api/upload` endpoint
- ✅ `deleteImage()` - Placeholder (Phase 3+)
- ✅ `updateImage()` - Placeholder (Phase 3+)

---

## Image Lifecycle (Phase 2 - Updated)

```
UPLOADED → INGESTED → PROCESSING → PROCESSED
                    ↓
                  (Jobs)
                  - OFFLOAD_ORIGINAL (simplified)
                  - THUMBNAIL_GENERATION
                  - PREVIEW_GENERATION
                  - EXIF_ENRICHMENT
```

> [!NOTE]
> **STORED state deferred to Phase 8.**
> Originals remain in temporary storage during Phase 2.
> All derived assets (thumbnails, previews) are generated in the cloud.

### State Transitions
1. **UPLOADED**: File received by API
2. **INGESTED**: Temp file written, metadata extracted
3. **PROCESSING**: Asset generation jobs running (thumbnails, previews, EXIF)
4. **PROCESSED**: All derived assets ready (thumbnails, previews, EXIF extracted)
5. **STORED**: Original moved to home server (**Phase 8 only**)
6. **FAILED**: Unrecoverable error (can happen at any state)

---

## Job Model Details

```ts
interface Job {
  id: string;
  type: 'OFFLOAD_ORIGINAL' | 'THUMBNAIL_GENERATION' | 'PREVIEW_GENERATION';
  payload: any;
  status: JobStatus; // PENDING, RUNNING, COMPLETED, FAILED
  attempts: number;
  maxAttempts: number;
  lockedAt: Date | null;
  lockedBy: string | null;
  lastError?: string;
  imageId?: string;
  image?: Image;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## File Structure

```
lib/
  jobs/
    queue.ts              ← Job enqueue functions
    runner.ts             ← Job runner service
    handlers/
      index.ts            ← Handler registration
      offload-original.ts ← Offload handler
      thumbnail-generation.ts
      preview-generation.ts
  server/
    initialize.ts         ← Server startup

app/
  layout.tsx              ← Initialize server
  api/
    upload/route.ts       ← Phase 1 upload
    images/route.ts       ← Phase 2 images list
    admin/
      jobs/route.ts       ← Job list (admin)
      jobs/[id]/route.ts  ← Job details (admin)
  actions/
    images.ts             ← Server actions
```

---

## Configuration

### Environment Variables
```bash
STORAGE_DIR=/tmp/storage     # Base directory for derived assets (cloud temp storage)
API_BASE=http://localhost:3000 # API base URL for server actions
```

> [!NOTE]
> Storage directory is temporary cloud storage. Home server storage (Phase 8) not yet implemented.

### Job Runner Settings
- **Batch size**: 5 jobs per poll (configurable)
- **Poll interval**: 5000ms (5 seconds for development)
- **Lock timeout**: 30000ms (30 seconds)
- **Max retries**: 3 attempts per job

---

## Frontend Integration Examples

### Using the Images List API
```ts
// In a client component
import { fetchImages } from '@/app/actions/images';

const { data: images } = await fetchImages();

images.forEach(img => {
  console.log(`${img.title}: ${img.status}`);
  
  if (img.isProcessing) {
    console.log(`Processing jobs: ${img.processingJobs.length}`);
  }
  
  if (img.isStored) {
    console.log(`Preview: ${img.previewPath}`);
  }
});
```

### Uploading an Image
```ts
import { uploadImage } from '@/app/actions/images';

const formData = new FormData();
formData.append('file', file);
formData.append('title', 'My Image');
formData.append('collection', 'Vacation 2026');

const { data, error } = await uploadImage(formData);

if (!error) {
  console.log(`Uploaded: ${data.imageId}`);
  console.log(`Status: ${data.status}`); // INGESTED initially
}
```

### Monitoring Job Progress
```ts
// Fetch admin job details
const response = await fetch(`/api/admin/jobs/${jobId}`);
const job = await response.json();

console.log(`Job status: ${job.status}`);
console.log(`Attempts: ${job.attempts}/${job.maxAttempts}`);
console.log(`Error: ${job.lastError}`);
```

---

## Testing the Job Runner

### Local Development
```bash
# Start the server (includes job runner)
npm run dev

# Watch logs for job processing
# Job Runner will poll every 5 seconds and process pending jobs
```

### Manual Testing
```bash
# Upload an image
curl -X POST http://localhost:3000/api/upload \
  -F "file=@image.jpg"

# Get image status (watch state progress)
curl http://localhost:3000/api/images

# Check job details
curl http://localhost:3000/api/admin/jobs?status=PENDING

# Check specific job
curl http://localhost:3000/api/admin/jobs/[jobId]
```

---

## Phase 2 Compliance Checklist

- ✅ Jobs are DB-backed (persistent across restarts)
- ✅ Jobs use advisory locking (DB UPDATE-based)
- ✅ Jobs are retry-capable with exponential backoff
- ✅ Derived assets use deterministic paths
- ✅ All processing happens in job runner (not API routes)
- ✅ Image originals are immutable
- ✅ Admin APIs are read-only (no manual execution/retry)
- ✅ Idempotent design (safe to regenerate derived assets)

---

## What's Next (Phase 3+)

- **Phase 3**: Authentication & access control
- **Phase 4**: Multi-tenancy / projects
- **Phase 5**: Manual job control (retry, cancel)
- **Phase 6**: ML features (face detection, embeddings)
- **Phase 7**: Full-text search, Performance optimization
- **Phase 8**: Home Server Integration (storage backends, home server offload)

---

## Phase 8 Migration Path

When ready to implement home server integration (Phase 8):

1. **Enhance OFFLOAD_ORIGINAL handler** to:
   - Stream temp file → home server filesystem
   - Verify checksum after transfer
   - Update status to STORED after confirmation
   - Clean up temp file

2. **Add Home Server storage API**:
   - Secure upload endpoint
   - Checksum verification
   - Health check endpoints

3. **Update Image Lifecycle**:
   - Add STORED state transition after PROCESSED
   - Track home server path in database

4. **Backwards Compatibility**:
   - All existing PROCESSED images remain valid
   - Phase 8 offload is optional per-image
   - System works without home server

## Questions?

See `.ai/contracts/phase-2-processing.md` for detailed requirements.  
See `TODO.md` for updated phase roadmap including Phase 8.
