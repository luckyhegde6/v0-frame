# Phase 2 Quick Reference Card

## File Structure

```
lib/
  jobs/
    queue.ts                    ← Job enqueue functions
    runner.ts                   ← Job runner (long-lived process)
    handlers/
      index.ts                  ← Register handlers
      offload-original.ts       ← Move temp → permanent
      thumbnail-generation.ts   ← Generate thumbnails
      preview-generation.ts     ← Generate preview
  phase2/
    client-utils.ts             ← Frontend helper functions
  server/
    initialize.ts               ← Server startup

components/
  image-upload-progress.tsx     ← Progress indicator

app/
  api/
    upload/route.ts             ← Phase 1: Upload
    images/route.ts             ← Get images + status
    admin/jobs/route.ts         ← List jobs
    admin/jobs/[id]/route.ts    ← Job details
  actions/
    images.ts                   ← Server actions
  layout.tsx                    ← Initialize server
```

## API Endpoints

### Upload
```
POST /api/upload
Form data: file, title, collection
Response: { imageId, status, checksum, sizeBytes, uploadedAt }
```

### Get Images
```
GET /api/images
Response: { data: [Image], collections, count }
Fields on Image: id, status, title, thumbnailPath, previewPath, processingJobs, isProcessing, isStored
```

### Admin: List Jobs
```
GET /api/admin/jobs?status=PENDING&type=OFFLOAD_ORIGINAL&limit=10&offset=0
Response: { jobs: [Job], pagination: { total, limit, offset, hasMore } }
```

### Admin: Job Details
```
GET /api/admin/jobs/:id
Response: { id, type, status, attempts, maxAttempts, payload, locked, retryInfo, image }
```

## Image States

```
UPLOADED   → File received by API
INGESTED   → Temp file saved + metadata extracted
PROCESSING → Assets being generated (thumbnails, preview)
STORED     → Complete (original + assets ready)
FAILED     → Error during processing
```

## Job Types

```
OFFLOAD_ORIGINAL
├─ Payload: { imageId, tempPath, checksum }
├─ Action: Move temp → permanent storage
└─ Next: Enqueue THUMBNAIL_GENERATION + PREVIEW_GENERATION

THUMBNAIL_GENERATION
├─ Payload: { imageId, originalPath, sizes: [64, 128, 256, 512] }
├─ Action: Create thumbnail JPEGs
└─ Updates: image.thumbnailPath

PREVIEW_GENERATION
├─ Payload: { imageId, originalPath }
├─ Action: Create web-optimized preview
└─ Updates: image.previewPath, image.status → STORED
```

## Frontend Usage

### Fetch Images
```ts
import { fetchImages } from '@/app/actions/images';

const { data: images } = await fetchImages();
images.forEach(img => {
  console.log(`${img.title}: ${img.status}`);
  if (img.isStored) {
    // Use img.previewPath
  }
});
```

### Upload Image
```ts
import { uploadImage } from '@/app/actions/images';

const form = new FormData();
form.append('file', file);
form.append('title', 'My Image');

const { data, error } = await uploadImage(form);
```

### Monitor Progress
```ts
import { pollImageStatus } from '@/lib/phase2/client-utils';

pollImageStatus(imageId, (image) => {
  console.log(`Status: ${image.status}`);
  if (image.status === 'STORED') {
    // Image ready!
  }
}).catch(err => console.error(err));
```

### Use Progress Component
```tsx
import { ImageUploadProgress } from '@/components/image-upload-progress';

<ImageUploadProgress
  imageId={imageId}
  onComplete={(image) => console.log('Done!', image)}
  onError={(error) => console.error(error)}
/>
```

## Key Functions

### Server (Job Runner)
```ts
// Initialize (automatic on server start)
import { initializeServer } from '@/lib/server/initialize';
await initializeServer();

// Start runner (called by initialize)
import { startJobRunner } from '@/lib/jobs/runner';
startJobRunner(batchSize, pollIntervalMs);

// Register handler (called by initialize)
import { registerJobHandler } from '@/lib/jobs/runner';
registerJobHandler('OFFLOAD_ORIGINAL', handleOffloadOriginal);
```

### Frontend (Client Utils)
```ts
import {
  getImages,
  getAssetUrl,
  getThumbnailUrl,
  getPreviewUrl,
  isImageReady,
  getImageStatusLabel,
  getJobs,
  getJob,
  pollImageStatus
} from '@/lib/phase2/client-utils';
```

### Server Actions
```ts
import {
  fetchImages,
  uploadImage,
  deleteImage,
  updateImage
} from '@/app/actions/images';
```

## Environment Setup

```bash
# .env.local or Vercel dashboard
DATABASE_URL=postgresql://...
STORAGE_DIR=/tmp/storage
API_BASE=http://localhost:3000
```

## Common Commands

```bash
# Start dev (includes job runner)
npm run dev

# Database migration
npm run db:push

# Prisma studio
npm run db:studio

# Generate Prisma client
npm run db:generate

# Open database shell
sqlite3 prisma/dev.db
# or
psql -d your_database
```

## Testing Quickly

```bash
# 1. Create test image
convert -size 100x100 xc:red test.jpg

# 2. Upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.jpg"

# 3. Check status
curl http://localhost:3000/api/images | jq '.data[0]'

# 4. List jobs
curl http://localhost:3000/api/admin/jobs
```

## Troubleshooting

| Problem | Check |
|---------|-------|
| Jobs stuck in PENDING | Database connected? Handler registered? |
| No thumbnails | Is THUMBNAIL_GENERATION job running? |
| High memory | Reduce batch size: `startJobRunner(2, 5000)` |
| Logs not showing | Check console logs with `[Job Runner]` prefix |
| Locks not releasing | Check 30s timeout - may be waiting for lock to expire |

## Performance Tuning

```ts
// Fast (more resource usage)
startJobRunner(10, 2000);  // 10 jobs every 2s

// Balanced (default)
startJobRunner(5, 5000);   // 5 jobs every 5s

// Slow (low resource usage)
startJobRunner(2, 10000);  // 2 jobs every 10s
```

## Monitoring SQL Queries

```sql
-- Pending jobs
SELECT id, type, status FROM job WHERE status='PENDING';

-- Running jobs (locked)
SELECT id, type, locked_by, attempts FROM job WHERE status='RUNNING';

-- Failed jobs
SELECT id, type, attempts, max_attempts, last_error FROM job WHERE status='FAILED';

-- Images being processed
SELECT id, title, status FROM image WHERE status='PROCESSING';

-- Images with missing assets
SELECT id, title FROM image WHERE status='STORED' AND thumbnail_path IS NULL;
```

## Documentation Map

- **Full Details**: `PHASE_2_COMPLETE.md`
- **Implementation**: `PHASE_2_IMPLEMENTATION.md`
- **Deployment**: `DEPLOYMENT.md`
- **Testing**: `TESTING_PHASE_2.md`
- **Contract**: `.ai/contracts/phase-2-processing.md`

---

**Last Updated**: January 30, 2026  
**Phase**: 2 (Complete)  
**Status**: Production Ready
