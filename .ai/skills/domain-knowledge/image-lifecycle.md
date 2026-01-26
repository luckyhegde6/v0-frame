# Image Lifecycle

This document defines the complete image lifecycle for the FRAME photo management system.

## Overview

Every image in FRAME follows an explicit, enforced lifecycle from upload to final processing. The lifecycle ensures data safety, clear state transitions, and proper async boundaries.

## Complete Lifecycle

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
- ❌ `STORED` - Not yet implemented
- ❌ `PROCESSING` - Not yet implemented
- ❌ `PROCESSED` - Not yet implemented

> [!IMPORTANT]
> **Phase 1 work must comply with Phase 1 Ingestion Contracts**  
> See: [`.ai/contracts/phase-1-ingestion.md`](file:///.ai/contracts/phase-1-ingestion.md)

### Phase 2: Home Server Offload

**New States**:
- `STORED` - File confirmed on home server, checksum verified

### Phase 3: Derived Assets

**No new states** - uses existing `PROCESSING` → `PROCESSED`

### Phase 4: ML Pipeline

**Uses existing states**: `PROCESSING` → `PROCESSED`

### Phase 5: Search & Retrieval

**No new states** - operates on `PROCESSED` images

## State Definitions

### UPLOADED
- **Meaning**: Client finished sending bytes to server
- **Duration**: Milliseconds (in-flight)
- **Location**: Network stream
- **Next States**: `INGESTED`, `FAILED`
- **Introduced**: Phase 1

### INGESTED
- **Meaning**: File safely written to temporary cloud storage + metadata stored in database
- **Duration**: Minutes to hours (until home server offload)
- **Location**: Cloud temporary filesystem (`/tmp/ingest/`)
- **Next States**: `STORED` (Phase 2), `FAILED`
- **Introduced**: Phase 1

### STORED
- **Meaning**: File confirmed on home server, checksum verified, temp file can be cleaned
- **Duration**: Indefinite (until processing starts)
- **Location**: Home server filesystem (canonical)
- **Next States**: `PROCESSING`, `FAILED`
- **Introduced**: Phase 2

### PROCESSING
- **Meaning**: Background ML pipeline running (thumbnails, EXIF, face detection, embeddings)
- **Duration**: Minutes to hours (depending on ML complexity)
- **Location**: Home server (originals) + Cloud (derived assets)
- **Next States**: `PROCESSED`, `FAILED`
- **Introduced**: Phase 4

### PROCESSED
- **Meaning**: All processing complete, image ready for search and retrieval
- **Duration**: Indefinite (terminal state)
- **Location**: Home server (originals) + Cloud (thumbnails, previews, embeddings)
- **Next States**: None (terminal)
- **Introduced**: Phase 4

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
// Complete lifecycle transitions
const LIFECYCLE_TRANSITIONS: Record<ImageStatus, ImageStatus[]> = {
  UPLOADED: ['INGESTED', 'FAILED'],
  INGESTED: ['STORED', 'FAILED'],
  STORED: ['PROCESSING', 'FAILED'],
  PROCESSING: ['PROCESSED', 'FAILED'],
  PROCESSED: [], // Terminal state
  FAILED: ['UPLOADED'], // Retry from beginning
};

function validateTransition(from: ImageStatus, to: ImageStatus): void {
  const allowed = LIFECYCLE_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new Error(
      `Invalid lifecycle transition: ${from} → ${to}. ` +
      `Allowed transitions from ${from}: ${allowed.join(', ')}`
    );
  }
}
```

## Lifecycle Implementation

### Database Schema

```prisma
model Image {
  id        String      @id @default(cuid())
  status    ImageStatus // Enum
  
  // Timestamps for each state
  uploadedAt   DateTime?
  ingestedAt   DateTime?
  storedAt     DateTime?
  processingAt DateTime?
  processedAt  DateTime?
  failedAt     DateTime?
  
  // State-specific data
  tempPath     String?   // INGESTED only
  homePath     String?   // STORED+
  checksum     String    @unique
  
  // Metadata
  mimeType  String
  width     Int
  height    Int
  sizeBytes Int
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([status])
  @@index([checksum])
}

enum ImageStatus {
  UPLOADED
  INGESTED
  STORED
  PROCESSING
  PROCESSED
  FAILED
}
```

### State Transition Function

```typescript
class ImageLifecycle {
  static async transition(
    imageId: string,
    toStatus: ImageStatus
  ): Promise<void> {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
    });
    
    if (!image) {
      throw new Error(`Image not found: ${imageId}`);
    }
    
    // Validate transition
    validateTransition(image.status, toStatus);
    
    // Prepare update data
    const updateData: any = {
      status: toStatus,
      updatedAt: new Date(),
    };
    
    // Set timestamp for new state
    const timestampField = `${toStatus.toLowerCase()}At`;
    updateData[timestampField] = new Date();
    
    // Perform atomic update
    await prisma.image.update({
      where: { id: imageId },
      data: updateData,
    });
    
    // Log transition
    console.log(`[Lifecycle] ${image.id}: ${image.status} → ${toStatus}`);
  }
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

3. **Offload Failures** (STORED → FAILED)
   - Home server unavailable
   - Network timeout
   - Checksum mismatch

4. **Processing Failures** (PROCESSING → FAILED)
   - ML pipeline crash
   - Image corruption
   - Resource exhaustion

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

3. **Failure Rate**
   ```sql
   -- Failure rate by day
   SELECT 
     DATE(createdAt) as date,
     COUNT(*) as total,
     SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
     ROUND(100.0 * SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) / COUNT(*), 2) as failure_rate
   FROM images
   GROUP BY DATE(createdAt)
   ORDER BY date DESC;
   ```

## Audit Trail

### Status History

```prisma
model ImageStatusHistory {
  id        String   @id @default(cuid())
  imageId   String
  fromStatus ImageStatus
  toStatus   ImageStatus
  timestamp  DateTime @default(now())
  triggeredBy String  // 'system' or userId
  
  image Image @relation(fields: [imageId], references: [id])
  
  @@index([imageId])
  @@index([timestamp])
}
```

### Logging Transitions

```typescript
async function logStatusTransition(
  imageId: string,
  fromStatus: ImageStatus,
  toStatus: ImageStatus,
  triggeredBy: string = 'system'
): Promise<void> {
  await prisma.imageStatusHistory.create({
    data: {
      imageId,
      fromStatus,
      toStatus,
      triggeredBy,
    },
  });
}
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
- **Global Rules**: `.ai/rules/global.md`
- **Lifecycle Rules**: `.ai/rules/lifecycle.md`
- **Async Patterns**: `.ai/skills/domain-knowledge/async-patterns.md`

---

**Remember**: The lifecycle is not optional. Every image must follow this exact flow.
