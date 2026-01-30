// Phase 2: Offload Original Handler
// Moves image from temp storage to permanent storage and enqueues derived asset jobs

import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { enqueueThumbnailJob, enqueuePreviewJob, enqueueExifJob } from '@/lib/jobs/queue';

const STORAGE_DIR = process.env.STORAGE_DIR || '/tmp/storage';

/**
 * Offload original image to permanent storage
 * Then enqueue thumbnail and preview generation jobs
 */
export async function handleOffloadOriginal(payload: any, jobId: string): Promise<void> {
  const { imageId, tempPath, checksum } = payload;

  console.log(`[Offload Handler] Processing image: ${imageId}`);

  // 1. Ensure storage directory exists
  await fs.mkdir(STORAGE_DIR, { recursive: true });

  // 2. Determine permanent storage path (deterministic, based on checksum)
  const extension = path.extname(tempPath);
  const storagePath = path.join(STORAGE_DIR, 'originals', `${checksum}${extension}`);
  const storageDir = path.dirname(storagePath);

  await fs.mkdir(storageDir, { recursive: true });

  // 3. Move temp file to permanent storage (idempotent - safe to regenerate)
  console.log(`[Offload Handler] Moving temp file: ${tempPath} → ${storagePath}`);

  try {
    await fs.rename(tempPath, storagePath);
  } catch (error: any) {
    // If file already exists (previous attempt succeeded), that's OK
    if (error.code === 'EEXIST') {
      console.log(`[Offload Handler] File already exists at: ${storagePath}`);
      // Clean up the temp file if it still exists
      try {
        await fs.unlink(tempPath);
      } catch { }
    } else {
      throw error;
    }
  }

  // 4. Update image record with permanent path and move to PROCESSING state
  const image = await prisma.image.update({
    where: { id: imageId },
    data: {
      tempPath: storagePath, // Now points to permanent storage
      status: 'PROCESSING'   // Phase 2: Begin processing
    }
  });

  console.log(`[Offload Handler] Image moved to permanent storage: ${imageId}`);

  // 5. Enqueue derived asset generation jobs
  console.log(`[Offload Handler] Enqueueing derived asset jobs: ${imageId}`);

  await enqueueThumbnailJob(imageId, storagePath);
  await enqueuePreviewJob(imageId, storagePath);
  await enqueueExifJob(imageId, storagePath);

  console.log(`[Offload Handler] Job complete: ${imageId}`);
}
