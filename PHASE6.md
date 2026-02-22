# Phase 6: Intelligence (Face Recognition & AI Detection)

## Overview
Phase 6 adds AI-powered features including face recognition, object detection, and vector search capabilities.

## Current State

### Database Schema (Complete)
- `DetectedFace` model - stores face detections with embeddings
- `FaceGroup` model - groups similar faces (same person)
- `DetectedObject` model - generic object detection
- `FaceRecStatus` enum on Image model

### Missing Components
1. **Job Handlers** - No handlers for face/object detection
2. **Admin Tasks** - No UI for triggering detection
3. **Face Management UI** - No interface to manage detected faces
4. **Vector Search** - pgvector not enabled

## Implementation Plan

### Step 1: Add Job Handlers

#### 1.1 Face Detection Handler
```
lib/jobs/handlers/face-detection.ts
```
- Accepts image IDs
- Uses face detection library (e.g., face-api.js, @vladmandic/face-api)
- Stores detected faces with embeddings
- Updates Image.faceRecognitionStatus

#### 1.2 Face Grouping Handler  
```
lib/jobs/handlers/face-grouping.ts
```
- Clusters similar faces using embeddings
- Creates FaceGroup entries
- Suggests names based on album context

#### 1.3 Object Detection Handler
```
lib/jobs/handlers/object-detection.ts
```
- Detects objects in images
- Uses COCO-trained model (@tensorflow-models/coco-ssd)
- Stores in DetectedObject table

### Step 2: Add Admin Tasks

#### 2.1 TASK_CONFIGS Updates
Add to `app/admin/tasks/[type]/client.tsx`:

```typescript
DETECT_FACES: {
  label: 'Detect Faces',
  icon: Users,
  description: 'Detect faces in images and generate embeddings',
  requiresSource: true,
  requiresDestination: false,
  sourceTypes: ['project', 'album', 'images'],
  configOptions: [
    { name: 'minConfidence', label: 'Min Confidence', type: 'number', default: 0.7, min: 0.1, max: 1.0 }
  ]
},

DETECT_OBJECTS: {
  label: 'Detect Objects',
  icon: Box,
  description: 'Detect objects in images using AI',
  requiresSource: true,
  requiresDestination: false,
  sourceTypes: ['project', 'album', 'images'],
  configOptions: []
},

GROUP_FACES: {
  label: 'Group Faces',
  icon: UserCheck,
  description: 'Group similar faces together',
  requiresSource: true,
  requiresDestination: false,
  sourceTypes: ['album'],
  configOptions: [
    { name: 'threshold', label: 'Similarity Threshold', type: 'number', default: 0.8, min: 0.5, max: 1.0 }
  ]
}
```

### Step 3: Add Face Management UI

#### 3.1 Face Gallery Page
```
app/admin/faces/page.tsx
```
- Grid view of all FaceGroups
- Shows cover image, name, face count
- Filter by album

#### 3.2 Face Group Detail Page
```
app/admin/faces/[id]/page.tsx
```
- All faces in group
- Name editing
- Merge/split faces

### Step 4: Enable pgvector

#### 4.1 Database Extension
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 4.2 Update Schema
Add vector column type for embeddings:
```prisma
embedding Float[]  // for pgvector
```

#### 4.3 Similarity Search
```typescript
// Find similar faces
await prisma.$queryRaw`
  SELECT * FROM "DetectedFace"
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 10
`
```

## Dependencies Required

```json
{
  "@vladmandic/face-api": "^2.0.0",
  "@tensorflow/tfjs": "^4.22.0",
  "@tensorflow-models/coco-ssd": "^2.2.3",
  "pgvector": "^0.2.0"
}
```

## File Changes Summary

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add vector type, enable extension |
| `lib/jobs/handlers/face-detection.ts` | New |
| `lib/jobs/handlers/face-grouping.ts` | New |
| `lib/jobs/handlers/object-detection.ts` | New |
| `lib/jobs/handlers/index.ts` | Register handlers |
| `app/admin/tasks/[type]/client.tsx` | Add task configs |
| `app/admin/faces/page.tsx` | New |
| `app/admin/faces/[id]/page.tsx` | New |

## Testing Strategy

1. Unit tests for face grouping algorithm
2. E2E tests for admin task execution
3. Manual testing of face management UI
