# Image Lifecycle

This document defines the complete image lifecycle for the FRAME photo management system.

> [!IMPORTANT]
> **UPDATE (2026-02-15)**: Home server integration has been moved to Phase 8.
> Phases 1-7 now operate entirely in cloud/temporary storage.
> Original files remain in temp storage until Phase 8 implementation.

## Overview

Every image in FRAME follows an explicit, enforced lifecycle from upload to final processing. The lifecycle ensures data safety, clear state transitions, and proper async boundaries.

## Complete Lifecycle (Phases 1-7 - Cloud Only)

```
UPLOADED
↓
INGESTED (temporary cloud storage)
↓
PROCESSING (background pipeline)
↓
PROCESSED (all assets ready)
```

## Complete Lifecycle (With Phase 8 - Home Server)

```
UPLOADED
↓
INGESTED (temporary cloud storage)
↓
PROCESSING (background pipeline)
↓
PROCESSED (all assets ready in cloud)
↓
[Phase 8: Home Server Integration]
↓
STORED (original moved to home server)
```

At any point, an image may transition to:
```
FAILED → UPLOADED (retry from beginning)
```

## Phase-Specific States

### Phase 1: Ingestion Foundation

**Legal States**:
- `UPLOADED` - Client finished sending bytes
- `INGESTED` - Temp file written + metadata stored
- `FAILED` - Unrecoverable ingestion error

**Forbidden States** (Phase 2+):
- ❌ `PROCESSING` - Not yet implemented
- ❌ `PROCESSED` - Not yet implemented
- ❌ `STORED` - Deferred to Phase 8

> [!IMPORTANT]
> **Phase 1 work must comply with Phase 1 Ingestion Contracts**  
> See: [`.ai/contracts/phase-1-ingestion.md`](file:///.ai/contracts/phase-1-ingestion.md)

### Phase 2: Asset Processing (UPDATED)

**New States**:
- `PROCESSING` - Background asset generation in progress
- `PROCESSED` - All derived assets (thumbnails, previews, EXIF) ready

**Note**: `STORED` state deferred to Phase 8. Originals remain in temp storage.

### Phase 3-7: Features & Intelligence

**Uses existing states**: `PROCESSING` → `PROCESSED`

- Authentication & Access Control (Phase 3)
- Projects & Sharing (Phase 4)
- Admin Control Plane (Phase 5)
- ML Pipeline - Intelligence (Phase 6)
- Hardening & Maintenance (Phase 7)

### Phase 8: Home Server Integration (NEW)

**New State**:
- `STORED` - File moved to home server, checksum verified

**Behavior**:
- Images in `PROCESSED` state are eligible for home server offload
- Offload is asynchronous and non-blocking
- Temp file cleaned up after successful home server confirmation

## State Definitions

### UPLOADED
- **Meaning**: Client finished sending bytes to server
- **Duration**: Milliseconds (in-flight)
- **Location**: Network stream
- **Next States**: `INGESTED`, `FAILED`
- **Introduced**: Phase 1

### INGESTED
- **Meaning**: File safely written to temporary cloud storage + metadata stored in database
- **Duration**: Minutes to hours (until processing completes)
- **Location**: Cloud temporary filesystem (`/tmp/ingest/`)
- **Next States**: `PROCESSING`, `FAILED`
- **Introduced**: Phase 1
- **Note**: In Phase 8, this will transition to `STORED` before `PROCESSING`

### PROCESSING
- **Meaning**: Background pipeline running (thumbnails, previews, EXIF)
- **Duration**: Seconds to minutes (depending on image size)
- **Location**: Cloud temp storage
- **Next States**: `PROCESSED`, `FAILED`
- **Introduced**: Phase 2

### PROCESSED
- **Meaning**: All processing complete, image ready for display
- **Duration**: Indefinite (until Phase 8 offload)
- **Location**: Cloud temp storage (originals + derived assets)
- **Next States**: `STORED` (Phase 8), None (terminal for Phases 2-7)
- **Introduced**: Phase 2

### STORED (Phase 8 Only)
- **Meaning**: File confirmed on home server, checksum verified, temp file cleaned
- **Duration**: Indefinite (terminal state)
- **Location**: Home server filesystem (canonical)
- **Next States**: None (terminal)
- **Introduced**: Phase 8
- **Note**: This state is only reachable after Phase 8 implementation

### FAILED
- **Meaning**: Unrecoverable error occurred, needs investigation or retry
- **Duration**: Until manual intervention or auto-retry
- **Location**: Depends on where failure occurred
- **Next States**: `UPLOADED` (retry from beginning)
- **Introduced**: Phase 1

## State Transition Rules

### Mandatory Rules

1. **No state skipping**: Must transition through all states in order
2. **No state merging**: Each state is distinct and explicit
3. **No state inference**: State must be explicitly set, never assumed
4. **All transitions persisted**: Every state change must be written to database
5. **Transitions are atomic**: State change + metadata update in single transaction

### Validation

```typescript
// Complete lifecycle transitions (Phases 1-7)
const LIFECYCLE_TRANSITIONS_PHASES_1_7: Record<ImageStatus, ImageStatus[]> = {
  UPLOADED: ['INGESTED', 'FAILED'],
  INGESTED: ['PROCESSING', 'FAILED'],
  PROCESSING: ['PROCESSED', 'FAILED'],
  PROCESSED: [], // Terminal state for Phases 2-7
  STORED: [], // Not used until Phase 8
  FAILED: ['UPLOADED'], // Retry from beginning
};

// Complete lifecycle transitions (With Phase 8)
const LIFECYCLE_TRANSITIONS_FULL: Record<ImageStatus, ImageStatus[]> = {
  UPLOADED: ['INGESTED', 'FAILED'],
  INGESTED: ['PROCESSING', 'FAILED'],
  PROCESSING: ['PROCESSED', 'FAILED'],
  PROCESSED: ['STORED', 'FAILED'], // Phase 8 transition
  STORED: [], // Terminal state
  FAILED: ['UPLOADED'], // Retry from beginning
};

function validateTransition(from: ImageStatus, to: ImageStatus, phase8Enabled: boolean = false): void {
  const transitions = phase8Enabled ? LIFECYCLE_TRANSITIONS_FULL : LIFECYCLE_TRANSITIONS_PHASES_1_7;
  const allowed = transitions[from] || [];
  if (!allowed.includes(to)) {
    throw new Error(
      `Invalid lifecycle transition: ${from} → ${to}. ` +
      `Allowed transitions from ${from}: ${allowed.join(', ')}`
    );
  }
}
```

## Phase-Specific Behaviors

### Phase 2-7 Behavior (Cloud Only)
```typescript
// OFFLOAD_ORIGINAL handler (simplified)
async function handleOffloadOriginal(imageId: string, tempPath: string): Promise<void> {
  // Skip home server offload - not implemented yet
  await prisma.image.update({
    where: { id: imageId },
    data: { status: 'PROCESSING' }
  });
  
  // Enqueue derived asset jobs
  await enqueueThumbnailJob(imageId, tempPath);
  await enqueuePreviewJob(imageId, tempPath);
  await enqueueExifJob(imageId, tempPath);
}
```

### Phase 8 Behavior (Home Server Integration)
```typescript
// Enhanced OFFLOAD_ORIGINAL handler
async function handleOffloadOriginalPhase8(imageId: string, tempPath: string): Promise<void> {
  // Stream file to home server
  await streamToHomeServer(tempPath, homeServerPath);
  
  // Verify checksum
  const verified = await verifyChecksum(homeServerPath, expectedChecksum);
  if (!verified) {
    throw new Error('Checksum mismatch after home server transfer');
  }
  
  // Update status to STORED
  await prisma.image.update({
    where: { id: imageId },
    data: { 
      status: 'STORED',
      homePath: homeServerPath,
      storedAt: new Date()
    }
  });
  
  // Clean up temp file
  await fs.unlink(tempPath);
}
```

## Failure Handling

### Failure Types

1. **Upload Failures** (UPLOADED → FAILED)
   - Network interruption
   - Invalid file format
   - File too large

2. **Ingestion Failures** (INGESTED → FAILED)
   - Temp storage full
   - Checksum computation error
   - Database write failure

3. **Processing Failures** (PROCESSING → FAILED)
   - Asset generation crash
   - Image corruption
   - Resource exhaustion

4. **Home Server Failures** (PROCESSED → FAILED) - Phase 8 Only
   - Home server unavailable
   - Network timeout
   - Checksum mismatch

### Recovery Procedures

#### Automatic Retry
```typescript
async function retryFailedImage(imageId: string): Promise<void> {
  const image = await prisma.image.findUnique({
    where: { id: imageId },
  });
  
  if (image.status !== 'FAILED') {
    throw new Error('Image is not in FAILED state');
  }
  
  // Reset to UPLOADED to retry from beginning
  await ImageLifecycle.transition(imageId, 'UPLOADED');
  
  // Re-enqueue upload job
  await enqueueUploadJob(imageId);
}
```

#### Manual Investigation
```sql
-- Find failed images
SELECT * FROM images
WHERE status = 'FAILED'
ORDER BY failedAt DESC;

-- Check failure patterns
SELECT 
  DATE(failedAt) as date,
  COUNT(*) as failures
FROM images
WHERE status = 'FAILED'
GROUP BY DATE(failedAt);
```

## Monitoring

### Key Metrics

1. **State Distribution**
   ```sql
   SELECT status, COUNT(*) as count
   FROM images
   GROUP BY status;
   ```

2. **Stuck Images**
   ```sql
   -- Images stuck in PROCESSING > 1 hour
   SELECT * FROM images
   WHERE status = 'PROCESSING'
   AND processingAt < NOW() - INTERVAL '1 hour';
   ```

3. **Processing Time**
   ```sql
   -- Average time from INGESTED to PROCESSED
   SELECT 
     AVG(EXTRACT(EPOCH FROM (processedAt - ingestedAt))) as avg_seconds
   FROM images
   WHERE status = 'PROCESSED';
   ```

4. **Home Server Sync Status** (Phase 8)
   ```sql
   -- Images awaiting Phase 8 offload
   SELECT COUNT(*) as pending_offload
   FROM images
   WHERE status = 'PROCESSED' 
   AND homePath IS NULL;
   ```

## Best Practices

### DO

- ✅ Always validate transitions before applying
- ✅ Log all state changes
- ✅ Use atomic database transactions
- ✅ Set timestamps for each state
- ✅ Handle failures explicitly
- ✅ Monitor stuck images
- ✅ Implement retry logic
- ✅ **Design for Phase 8 compatibility even if not yet implemented**

### DON'T

- ❌ Skip states
- ❌ Merge states
- ❌ Infer states
- ❌ Allow partial transitions
- ❌ Ignore failures
- ❌ Block on async work
- ❌ Modify originals

## References

- **Phase 1 Contracts**: `.ai/contracts/phase-1-ingestion.md`
- **Phase 2 Contracts**: `.ai/contracts/phase-2-processing.md`
- **Global Rules**: `.ai/rules/global.md`
- **Lifecycle Rules**: `.ai/rules/lifecycle.md`
- **Async Patterns**: `.ai/skills/domain-knowledge/async-patterns.md`
- **TODO**: `TODO.md` (contains phase roadmap)

---

**Remember**: The lifecycle is not optional. Every image must follow this exact flow. Phase 8 (Home Server) is an optional enhancement that can be added later without breaking the core functionality.
