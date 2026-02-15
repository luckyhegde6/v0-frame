// Phase 2: Offload Original Handler (Simplified)
// NOTE: Home server integration moved to Phase 8
// This handler now skips file movement and just enqueues derived asset jobs
// Original files remain in temp storage until Phase 8

import prisma from '@/lib/prisma';
import { enqueueThumbnailJob, enqueuePreviewJob, enqueueExifJob } from '@/lib/jobs/queue';

/**
 * Simplified Offload Handler (Phase 2)
 * 
 * Since home server integration is deferred to Phase 8, this handler:
 * 1. Skips actual file movement (temp file stays in place)
 * 2. Updates image status to PROCESSING
 * 3. Enqueues derived asset generation jobs (thumbnails, previews, EXIF)
 * 
 * In Phase 8, this will be enhanced to:
 * - Stream file to home server
 * - Verify checksum after transfer
 * - Update status to STORED after confirmation
 */
export async function handleOffloadOriginal(payload: any, jobId: string): Promise<void> {
  const { imageId, tempPath } = payload;

  console.log(`[Offload Handler] Processing image: ${imageId}`);
  console.log(`[Offload Handler] NOTE: Home server offload deferred to Phase 8`);
  console.log(`[Offload Handler] Temp file remains at: ${tempPath}`);

  // Update image record to PROCESSING state
  // Note: tempPath stays the same (still in temp storage)
  const image = await prisma.image.update({
    where: { id: imageId },
    data: {
      status: 'PROCESSING'   // Phase 2: Begin processing
    }
  });

  console.log(`[Offload Handler] Image status updated to PROCESSING: ${imageId}`);

  // Enqueue derived asset generation jobs
  // These will process the temp file and generate thumbnails/previews
  console.log(`[Offload Handler] Enqueueing derived asset jobs: ${imageId}`);

  await enqueueThumbnailJob(imageId, tempPath);
  await enqueuePreviewJob(imageId, tempPath);
  await enqueueExifJob(imageId, tempPath);

  console.log(`[Offload Handler] Job complete: ${imageId}`);
  console.log(`[Offload Handler] Images will remain in PROCESSING state until all derived assets are generated`);
  console.log(`[Offload Handler] Home server offload scheduled for Phase 8`);
}
