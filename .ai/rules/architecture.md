# FRAME Architecture Rules

These rules define the technical implementation standards for the FRAME self-hosted architecture.

## Runtime Model
1. **Unified Environment**: FRAME runs as a self-hosted Next.js application on a Node.js runtime. 
2. **Single Server**: The same server handles the UI, the API, and the background job execution loop.
3. **Source of Truth**: The local Filesystem (Originals) and PostgreSQL (Metadata/State) are the only authoritative data stores.

## Filesystem Layout
All image data must be stored using the following deterministic layout:
\`\`\`
/frame-data/
  images/
    {imageId}/
      original      # Immutable original byte-stream
      preview       # Optimized web preview
      thumbnails/   # Various scaled thumbnails
\`\`\`

## Background Job System
1. **Persistence**: Jobs must be persisted in the `Job` table before execution.
2. **Locking**: Jobs must be "locked" (marked as PROCESSING) during execution to prevent concurrent runs on the same item.
3. **Resilience**: The job runner must be able to resume pending jobs after a server restart or crash.
4. **Idempotency**: All job processors (e.g., thumbnail generation) must be idempotent. Repeating a job should not create side effects or duplicate data.

## Processing Pipeline
- Request -> Upload API -> Temp Storage -> DB Record -> Enqueue Job
- Runner Loop -> Lock Job -> Process Item (Metadata/Thumbs) -> Update DB -> Cleanup
- Heavy operations (processing) MUST happen in background jobs, never in the Request/Response cycle.
