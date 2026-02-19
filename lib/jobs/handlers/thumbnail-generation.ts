// Phase 2: Thumbnail Generation Handler
// Generates thumbnail images at multiple sizes using Sharp

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import prisma from '@/lib/prisma';

const STORAGE_DIR = process.env.STORAGE_DIR || '/tmp/storage';

/**
 * Generate thumbnails at multiple sizes
 * Safe to regenerate - overwrites existing thumbnails
 */
export async function handleThumbnailGeneration(payload: any, jobId: string): Promise<void> {
  let { imageId, originalPath, sizes } = payload;

  console.log(`[Thumbnail Handler] Generating thumbnails for: ${imageId}`, { sizes });

  // 1. Validate original file exists
  let fileExists = false;
  try {
    await fs.access(originalPath);
    fileExists = true;
  } catch {
    console.error(`[Thumbnail Handler] Original image not found at: ${originalPath}`);
    // Try to find the file in common temp locations
    const tempLocations = [
      path.join(process.env.STORAGE_DIR || '/tmp/storage', 'temp', 'ingest', path.basename(originalPath)),
      path.join(process.env.TEMP || '/tmp', 'v0-frame', 'ingest', path.basename(originalPath)),
      path.join(os.tmpdir(), 'v0-frame', 'ingest', path.basename(originalPath)),
    ];
    
    for (const loc of tempLocations) {
      try {
        await fs.access(loc);
        console.log(`[Thumbnail Handler] Found image at alternative location: ${loc}`);
        originalPath = loc;
        fileExists = true;
        break;
      } catch {
        // Continue to next location
      }
    }
  }

  if (!fileExists) {
    // Mark image as failed
    await prisma.image.update({
      where: { id: imageId },
      data: { status: 'FAILED' }
    });
    throw new Error(`Original image not found at: ${originalPath}`);
  }

  // 2. Ensure thumbnail directory exists
  const thumbnailDir = path.join(STORAGE_DIR, 'thumbnails', imageId);
  await fs.mkdir(thumbnailDir, { recursive: true });

  // 3. Generate thumbnails for each size
  const thumbnailPaths: Record<number, string> = {};

  for (const size of sizes) {
    const thumbPath = path.join(thumbnailDir, `thumb-${size}.jpg`);
    
    console.log(`[Thumbnail Handler] Generating ${size}px thumbnail: ${thumbPath}`);
    
    try {
      await sharp(originalPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);
      
      thumbnailPaths[size] = thumbPath;
      console.log(`[Thumbnail Handler] Created thumbnail: ${size}px`);
    } catch (error) {
      console.error(`[Thumbnail Handler] Failed to generate ${size}px thumbnail:`, error);
      throw error;
    }
  }

  // 4. Store the smallest thumbnail path in the image record
  // (for quick previews in listings)
  const smallestSize = Math.min(...sizes);
  const thumbPath = thumbnailPaths[smallestSize];

  console.log(`[Thumbnail Handler] Updating image record with thumbnail path: ${imageId}`);
  
  await prisma.image.update({
    where: { id: imageId },
    data: {
      thumbnailPath: thumbPath
    }
  });

  console.log(`[Thumbnail Handler] Thumbnails complete: ${imageId}`);
}
