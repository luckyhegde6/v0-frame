# Phase 2 Testing Guide

## Quick Start Test

### 1. Start the Development Server
```bash
npm run dev
```

Watch for this log:
```
[Server Init] Starting Phase 2 job runner...
[Job Handlers] Initializing handlers...
[Job Handlers] All handlers registered
[Job Runner] Starting with batchSize=5, pollInterval=5000ms
```

### 2. Upload a Test Image

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-image.jpg" \
  -F "title=Test Image" \
  -F "collection=TestCollection"
```

Expected response:
```json
{
  "imageId": "abc123...",
  "status": "INGESTED",
  "checksum": "sha256hash...",
  "sizeBytes": 12345,
  "uploadedAt": "2026-01-30T..."
}
```

### 3. Watch Job Processing

#### Monitor Console
Watch the console for job execution logs:
```
[Job Runner] Processing job: job-id
[Job Runner] Executing handler for type: OFFLOAD_ORIGINAL
[Offload Handler] Processing image: image-id
[Offload Handler] Moving temp file: /tmp/... → /tmp/storage/...
[Job Runner] Job completed: job-id
```

#### Check API Status
```bash
# Get image status
curl http://localhost:3000/api/images | jq '.data[0]'

# Should progress:
# INGESTED → PROCESSING → STORED
```

#### List All Jobs
```bash
curl http://localhost:3000/api/admin/jobs | jq '.jobs'
```

#### Check Specific Job
```bash
curl http://localhost:3000/api/admin/jobs/[jobId] | jq '.'
```

---

## Integration Tests

### Test 1: Full Upload Lifecycle

```bash
#!/bin/bash

# 1. Create test image (1000x1000 red square)
convert -size 1000x1000 xc:red test.jpg

# 2. Upload it
RESPONSE=$(curl -s -X POST http://localhost:3000/api/upload \
  -F "file=@test.jpg" \
  -F "title=Lifecycle Test")

IMAGE_ID=$(echo $RESPONSE | jq -r '.imageId')
echo "Uploaded: $IMAGE_ID"

# 3. Poll until STORED
for i in {1..30}; do
  STATUS=$(curl -s http://localhost:3000/api/images | \
    jq -r ".data[] | select(.id==\"$IMAGE_ID\") | .status")
  
  echo "Poll $i: $STATUS"
  
  if [ "$STATUS" = "STORED" ]; then
    echo "✓ Image processing complete!"
    break
  fi
  
  sleep 1
done

# 4. Verify derived assets
curl -s http://localhost:3000/api/images | \
  jq ".data[] | select(.id==\"$IMAGE_ID\") | {
    id,
    status,
    thumbnailPath,
    previewPath
  }"
```

### Test 2: Job Retry Mechanism

```bash
#!/bin/bash

# 1. Create a job manually (simulate failure)
sqlite3 prisma/dev.db "
INSERT INTO job (id, type, payload, status, attempts, maxAttempts, created_at, updated_at)
VALUES (
  'test-job-' || datetime('now'),
  'THUMBNAIL_GENERATION',
  '{\"imageId\": \"test\", \"originalPath\": \"/tmp/nonexistent.jpg\", \"sizes\": [64]}',
  'PENDING',
  0,
  3,
  datetime('now'),
  datetime('now')
);
"

# 2. Watch job runner attempt retry
sleep 10

# 3. Verify job has attempts > 0
sqlite3 prisma/dev.db "SELECT id, attempts, status FROM job WHERE type='THUMBNAIL_GENERATION';"
```

### Test 3: Concurrent Job Processing

```bash
#!/bin/bash

# Upload 5 images rapidly
for i in {1..5}; do
  convert -size 100x100 xc:rgb\(100,$((i*50)),200\) test-$i.jpg
  
  curl -s -X POST http://localhost:3000/api/upload \
    -F "file=@test-$i.jpg" \
    -F "title=Concurrent Test $i" &
done

wait

# Watch all jobs process
echo "Monitoring job queue..."
while true; do
  PENDING=$(curl -s http://localhost:3000/api/admin/jobs?status=PENDING | jq '.pagination.total')
  RUNNING=$(curl -s http://localhost:3000/api/admin/jobs?status=RUNNING | jq '.pagination.total')
  COMPLETED=$(curl -s http://localhost:3000/api/admin/jobs?status=COMPLETED | jq '.pagination.total')
  
  echo "PENDING: $PENDING | RUNNING: $RUNNING | COMPLETED: $COMPLETED"
  
  if [ "$PENDING" = "0" ] && [ "$RUNNING" = "0" ]; then
    echo "✓ All jobs completed"
    break
  fi
  
  sleep 2
done
```

---

## Manual Testing Scenarios

### Scenario 1: Check Job Locking

```bash
# 1. Get a RUNNING job
curl -s http://localhost:3000/api/admin/jobs?status=RUNNING | jq '.jobs[0]'

# Should have:
# "lockedAt": "2026-01-30T...",
# "lockedBy": "worker-pid-timestamp"

# 2. Try to process same job from another worker (should be skipped)
# This is automatic with advisory locking
```

### Scenario 2: Verify Idempotency

```bash
# 1. Manually reset a COMPLETED job status
curl -s http://localhost:3000/api/admin/jobs | jq '.jobs[] | select(.status=="COMPLETED") | .id' | head -1

# Get job ID and manually set to PENDING
# UPDATE job SET status='PENDING' WHERE id='...';

# 2. Job runner will process it again
# 3. Verify derived assets are the same (safe to regenerate)
```

### Scenario 3: Cleanup and Recovery

```bash
# 1. Simulate server crash during processing
# - Kill the Node process
# - Don't delete database

# 2. Restart server
npm run dev

# 3. Verify:
# - RUNNING jobs become PENDING (locks expire after 30s)
# - Job runner picks them up and retries
# - No duplicates created
```

---

## Performance Testing

### Load Test: 100 Small Images

```bash
#!/bin/bash

# Create 100 small test images
mkdir -p test-images
for i in {1..100}; do
  convert -size 100x100 xc:rgb\(100,$((RANDOM%256)),$((RANDOM%256))\) test-images/img-$i.jpg
done

# Upload all
TIME_START=$(date +%s)
for i in {1..100}; do
  curl -s -X POST http://localhost:3000/api/upload \
    -F "file=@test-images/img-$i.jpg" \
    -F "title=Load Test $i" > /dev/null &
  
  # Rate limit to 10 concurrent uploads
  if [ $((i % 10)) -eq 0 ]; then
    wait
  fi
done
wait
TIME_UPLOADS=$(date +%s)

echo "Uploads completed in $((TIME_UPLOADS - TIME_START))s"

# Monitor processing
while true; do
  STORED=$(curl -s http://localhost:3000/api/images | jq '.data | map(select(.status=="STORED")) | length')
  echo "Stored: $STORED/100"
  
  if [ "$STORED" = "100" ]; then
    TIME_END=$(date +%s)
    echo "✓ All images processed in $((TIME_END - TIME_START))s"
    break
  fi
  
  sleep 5
done
```

### Memory Usage Test

```bash
# Monitor memory while processing
watch -n 1 'curl -s http://localhost:3000/api/admin/jobs?status=RUNNING | jq ".pagination.total"'

# In another terminal:
top -p $(pgrep -f "next dev")
```

---

## Debugging Tips

### Enable Verbose Logging

Add to your code:
```ts
console.log("[v0] Processing image:", { imageId, status: 'PROCESSING' })
console.log("[v0] State updated:", newState)
```

### Database Inspection

```bash
# Open Prisma Studio
npm run db:studio

# Or use sqlite3/psql
psql -d your_database -c "SELECT id, status, type, attempts FROM job ORDER BY created_at DESC LIMIT 10;"
```

### Check File System

```bash
# List generated assets
ls -la /tmp/storage/

# Verify thumbnail sizes
ls -la /tmp/storage/thumbnails/
file /tmp/storage/thumbnails/[imageId]/*

# Check preview
file /tmp/storage/previews/[imageId]/preview.jpg
```

### Error Handling Test

```bash
# Test upload with invalid file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@nonexistent.jpg"

# Expected: 400 error with descriptive message

# Test with missing handler
# Manually insert job with invalid type in DB
# Watch job runner handle gracefully
```

---

## Checklist for Deployment

- [ ] All tests pass locally
- [ ] No errors in console output
- [ ] Images progress through all states: UPLOADED → INGESTED → PROCESSING → STORED
- [ ] Thumbnails generated in `/tmp/storage/thumbnails/`
- [ ] Previews generated in `/tmp/storage/previews/`
- [ ] Admin jobs API returns correct data
- [ ] Failed jobs have error messages and attempt counts
- [ ] Job locking prevents duplicate processing
- [ ] Server restart doesn't lose jobs (DB-backed recovery)

---

## Questions?

See `PHASE_2_IMPLEMENTATION.md` for architecture overview.  
See `.ai/contracts/phase-2-processing.md` for detailed requirements.
