# Phase 2 Deployment Guide

## Pre-Deployment Checklist

- [ ] Database migration executed (`prisma db push`)
- [ ] Environment variables set:
  - `DATABASE_URL` - PostgreSQL connection string
  - `STORAGE_DIR` - Local storage directory (default: `/tmp/storage`)
  - `API_BASE` - API base URL (default: `http://localhost:3000`)
- [ ] Sharp library installed (`npm install sharp`)
- [ ] Prisma client generated (`npm run db:generate`)

## Local Development Setup

```bash
# 1. Create storage directory
mkdir -p /tmp/storage

# 2. Set environment variables
export STORAGE_DIR=/tmp/storage
export API_BASE=http://localhost:3000

# 3. Run database migration
npm run db:push

# 4. Start development server
npm run dev

# Job runner will start automatically with Next.js server
# Watch console for: "[Job Runner] Starting with batchSize=5, pollInterval=5000ms"
```

## Production Deployment

### Vercel Deployment

```bash
# 1. Set environment variables in Vercel dashboard
STORAGE_DIR=/tmp/storage  # Or use persistent storage (see below)
API_BASE=https://your-domain.com

# 2. Ensure database is migrated
# (Done automatically on build with "db:generate" script)

# 3. Deploy
git push
```

### Using Persistent Storage (Recommended for Production)

For production, replace `/tmp/storage` with persistent storage:

```bash
# Option 1: Vercel Blob
# Set environment: STORAGE_DIR=blob:///frame-storage

# Option 2: AWS S3
# Set environment: STORAGE_DIR=s3://bucket-name/storage

# Option 3: Custom NFS mount
# Set environment: STORAGE_DIR=/mnt/storage
```

Update handlers to use your storage backend instead of local filesystem.

## Monitoring

### Job Runner Health

```bash
# Check recent jobs
curl https://your-domain.com/api/admin/jobs?limit=10

# Check jobs by status
curl https://your-domain.com/api/admin/jobs?status=RUNNING
curl https://your-domain.com/api/admin/jobs?status=FAILED

# View specific job details
curl https://your-domain.com/api/admin/jobs/{jobId}
```

### Log Entries to Watch For

Development logs include markers for easy filtering:
- `[Job Runner]` - Runner lifecycle events
- `[Upload API]` - Upload requests
- `[Job Enqueue]` - Job creation
- `[Offload Handler]` - Asset offloading
- `[Thumbnail Handler]` - Thumbnail generation
- `[Preview Handler]` - Preview generation

### Common Issues

**Job Runner Not Starting**
- Check: Is Next.js server running? (`npm run dev`)
- Check: Are all handlers registered? Look for `[Job Handlers] All handlers registered`

**Jobs Stuck in PENDING**
- Check: Database connection working? (`npm run db:studio`)
- Check: Job handler exists for job type?
- Check: Is storage directory writable? (`ls -la /tmp/storage`)

**High Memory Usage**
- Increase poll interval: `startJobRunner(5, 10000)` (10s instead of 5s)
- Reduce batch size: `startJobRunner(2, 5000)` (2 jobs instead of 5)

**Images Not Getting Thumbnails**
- Check: Sharp installation: `npm ls sharp`
- Check: Is THUMBNAIL_GENERATION job running? Check `/api/admin/jobs`
- Check: Storage directory permissions: `chmod 755 /tmp/storage`

## Rollback

If issues occur, rollback is safe:

```bash
# Phase 2 is fully backwards compatible with Phase 1
# Existing INGESTED images will continue to work
# Just deploy previous version and images will remain

# Manual cleanup if needed:
# DELETE FROM job WHERE status = 'PENDING'; -- Clear stuck jobs
# UPDATE image SET status = 'INGESTED' WHERE status = 'PROCESSING'; -- Reset stuck images
```

## Performance Tuning

### For High Load

```ts
// In /lib/server/initialize.ts
startJobRunner(
  10,     // Process 10 jobs per batch
  2000    // Poll every 2 seconds
);
```

### For Low Resources (VPS/Small Server)

```ts
startJobRunner(
  2,      // Process 2 jobs per batch
  10000   // Poll every 10 seconds
);
```

## Scaling Recommendations

### Single Server
- Works fine for up to 1000s of images
- 1-2 jobs per second processing rate

### Distributed System
- Run multiple instances with same `STORAGE_DIR` (shared storage required)
- Advisory locking prevents duplicate processing
- Each instance polls independently

```bash
# Instance 1
WORKER_ID=worker-1 npm run start

# Instance 2  
WORKER_ID=worker-2 npm run start
```

## Maintenance

### Cleanup Old Jobs

```sql
-- Keep jobs for 30 days, clean older ones
DELETE FROM job 
WHERE status = 'COMPLETED' 
  AND updated_at < NOW() - INTERVAL '30 days';

DELETE FROM job 
WHERE status = 'FAILED' 
  AND attempts >= max_attempts 
  AND updated_at < NOW() - INTERVAL '7 days';
```

### Generate Missing Thumbnails

If thumbnails are missing for existing images:

```ts
// Run this in a migration or one-time job
const images = await prisma.image.findMany({
  where: { thumbnailPath: null, status: 'STORED' }
});

for (const image of images) {
  await enqueueThumbnailJob(image.id, image.tempPath);
}
```

---

## Support

For Phase 2 contract details, see: `.ai/contracts/phase-2-processing.md`  
For Phase 1 (upload) details, see: `.ai/contracts/phase-1-ingestion.md`
