# Image Lifecycle Rules

Every image in the FRAME system MUST conform to the lifecycle defined below. These rules are non-negotiable.

## Lifecycle States

```
UPLOADED
↓
INGESTED (temporary cloud storage)
↓
STORED (home server confirmed)
↓
PROCESSING (background pipeline)
↓
PROCESSED
```

## State Definitions

### UPLOADED
- **Meaning**: File received by cloud server
- **Location**: Nowhere yet (in-flight)
- **Next States**: INGESTED, FAILED
- **Duration**: Milliseconds

### INGESTED
- **Meaning**: File saved to temporary cloud storage
- **Location**: Cloud temp filesystem
- **Next States**: STORED, FAILED
- **Duration**: Minutes to hours (depending on home server availability)

### STORED
- **Meaning**: File confirmed on home server, checksum verified
- **Location**: Home server filesystem (canonical)
- **Next States**: PROCESSING, FAILED
- **Duration**: Indefinite (until processing starts)

### PROCESSING
- **Meaning**: Background ML pipeline running
- **Location**: Home server (originals) + Cloud (derived assets)
- **Next States**: PROCESSED, FAILED
- **Duration**: Minutes to hours (depending on ML complexity)

### PROCESSED
- **Meaning**: All processing complete, ready for use
- **Location**: Home server (originals) + Cloud (thumbnails, previews, embeddings)
- **Next States**: None (terminal state)
- **Duration**: Indefinite

### FAILED
- **Meaning**: Error occurred, needs investigation/retry
- **Location**: Depends on where failure occurred
- **Next States**: UPLOADED (retry from beginning)
- **Duration**: Until manual intervention or auto-retry

## Mandatory Rules

### Rule 1: No State Skipping

❌ **Forbidden**:
```typescript
// Skip from UPLOADED to STORED
await updateImageStatus(imageId, 'STORED');
```

✅ **Required**:
```typescript
// Transition through all states
await updateImageStatus(imageId, 'INGESTED');
// ... later ...
await updateImageStatus(imageId, 'STORED');
```

### Rule 2: No State Merging

❌ **Forbidden**:
```typescript
// Combine INGESTED and STORED
async function uploadAndStore(file) {
  await saveToTemp(file);
  await saveToHomeServer(file); // ❌ Synchronous!
  await updateStatus('STORED'); // ❌ Skipped INGESTED!
}
```

✅ **Required**:
```typescript
// Separate states with async boundaries
async function ingest(file) {
  await saveToTemp(file);
  await updateStatus('INGESTED');
  await enqueueOffloadJob(file.id);
}

async function offloadWorker(fileId) {
  await saveToHomeServer(fileId);
  await updateStatus('STORED');
}
```

### Rule 3: Preserve Idempotency

All state transitions must be idempotent (safe to retry).

✅ **Idempotent**:
```typescript
async function transitionToStored(imageId: string) {
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  
  // Check current state
  if (image.status === 'STORED') {
    return; // Already done, safe to skip
  }
  
  if (image.status !== 'INGESTED') {
    throw new Error(`Invalid transition: ${image.status} → STORED`);
  }
  
  // Perform transition
  await prisma.image.update({
    where: { id: imageId },
    data: { status: 'STORED', storedAt: new Date() }
  });
}
```

### Rule 4: Handle Retries Safely

Failed operations must be retryable without data corruption.

✅ **Safe Retry**:
```typescript
async function offloadToHomeServer(imageId: string) {
  const image = await getImage(imageId);
  
  // Check if already offloaded
  const exists = await checkHomeServerFile(image.checksum);
  if (exists) {
    await updateStatus(imageId, 'STORED');
    return; // Already done
  }
  
  // Perform offload
  await streamToHomeServer(image);
  const verified = await verifyChecksum(image);
  
  if (!verified) {
    throw new Error('Checksum mismatch'); // Will retry
  }
  
  await updateStatus(imageId, 'STORED');
}
```

## State Transition Matrix

| From | To | Allowed | Reason |
|------|-----|---------|--------|
| UPLOADED | INGESTED | ✅ | Normal flow |
| UPLOADED | FAILED | ✅ | Upload error |
| INGESTED | STORED | ✅ | Normal flow |
| INGESTED | FAILED | ✅ | Offload error |
| STORED | PROCESSING | ✅ | Normal flow |
| STORED | FAILED | ✅ | Processing error |
| PROCESSING | PROCESSED | ✅ | Normal flow |
| PROCESSING | FAILED | ✅ | ML error |
| FAILED | UPLOADED | ✅ | Retry from beginning |
| Any | Any (skip) | ❌ | Violates lifecycle |

## Validation

### Enforce Transitions

```typescript
class ImageLifecycle {
  private static validTransitions: Record<ImageStatus, ImageStatus[]> = {
    UPLOADED: ['INGESTED', 'FAILED'],
    INGESTED: ['STORED', 'FAILED'],
    STORED: ['PROCESSING', 'FAILED'],
    PROCESSING: ['PROCESSED', 'FAILED'],
    FAILED: ['UPLOADED'],
    PROCESSED: [], // Terminal state
  };

  static validate(from: ImageStatus, to: ImageStatus): void {
    const allowed = this.validTransitions[from] || [];
    if (!allowed.includes(to)) {
      throw new Error(
        `Invalid lifecycle transition: ${from} → ${to}. ` +
        `Allowed transitions from ${from}: ${allowed.join(', ')}`
      );
    }
  }

  static async transition(imageId: string, to: ImageStatus): Promise<void> {
    const image = await prisma.image.findUnique({ where: { id: imageId } });
    
    this.validate(image.status, to);
    
    await prisma.image.update({
      where: { id: imageId },
      data: {
        status: to,
        updatedAt: new Date(),
        [`${to.toLowerCase()}At`]: new Date() // e.g., storedAt, processedAt
      }
    });
  }
}
```

## Audit Trail

All state transitions must be logged for debugging and compliance.

```typescript
await prisma.imageStatusHistory.create({
  data: {
    imageId,
    fromStatus: currentStatus,
    toStatus: newStatus,
    timestamp: new Date(),
    triggeredBy: 'system' // or userId
  }
});
```

## Monitoring

Track images in each state:

```sql
-- Images by status
SELECT status, COUNT(*) 
FROM images 
GROUP BY status;

-- Stuck images (in PROCESSING > 1 hour)
SELECT * FROM images
WHERE status = 'PROCESSING'
AND updated_at < NOW() - INTERVAL '1 hour';

-- Failed images
SELECT * FROM images
WHERE status = 'FAILED'
ORDER BY updated_at DESC;
```

## Recovery Procedures

### Stuck in INGESTED
- **Cause**: Home server unavailable
- **Fix**: Retry offload job when server available
- **Prevention**: Implement exponential backoff

### Stuck in PROCESSING
- **Cause**: ML pipeline crashed
- **Fix**: Restart processing job
- **Prevention**: Add job timeouts and monitoring

### Repeated FAILED
- **Cause**: Persistent error (bad file, bug)
- **Fix**: Manual investigation required
- **Prevention**: Better validation, error logging

## Examples

### Complete Upload Flow

```typescript
// 1. UPLOADED → INGESTED
async function handleUpload(file: File) {
  // Save to temp
  const tempPath = await saveToTemp(file);
  
  // Create DB record
  const image = await prisma.image.create({
    data: {
      status: 'UPLOADED',
      filename: file.name,
      checksum: await calculateChecksum(file),
    }
  });
  
  // Transition to INGESTED
  await ImageLifecycle.transition(image.id, 'INGESTED');
  
  // Enqueue offload job
  await enqueueJob('offload', { imageId: image.id });
  
  return image;
}

// 2. INGESTED → STORED
async function offloadWorker(imageId: string) {
  const image = await getImage(imageId);
  
  // Stream to home server
  await streamToHomeServer(image);
  
  // Verify checksum
  const verified = await verifyChecksum(image);
  if (!verified) {
    await ImageLifecycle.transition(imageId, 'FAILED');
    throw new Error('Checksum mismatch');
  }
  
  // Transition to STORED
  await ImageLifecycle.transition(imageId, 'STORED');
  
  // Cleanup temp file
  await cleanupTempFile(image.tempPath);
  
  // Enqueue processing job
  await enqueueJob('process', { imageId });
}

// 3. STORED → PROCESSING → PROCESSED
async function processWorker(imageId: string) {
  await ImageLifecycle.transition(imageId, 'PROCESSING');
  
  try {
    await generateThumbnails(imageId);
    await extractMetadata(imageId);
    await runMLPipeline(imageId);
    
    await ImageLifecycle.transition(imageId, 'PROCESSED');
  } catch (error) {
    await ImageLifecycle.transition(imageId, 'FAILED');
    throw error;
  }
}
```

---

**Remember**: The lifecycle is not optional. Every image must follow this exact flow, no exceptions.
