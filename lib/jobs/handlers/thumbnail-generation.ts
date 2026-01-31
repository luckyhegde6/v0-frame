// Phase 2: Thumbnail Generation Handler
// Generates thumbnail images at multiple sizes using Sharp

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import prisma from '@/lib/prisma';

const STORAGE_DIR = process.env.STORAGE_DIR || '/tmp/storage';

/**
 * Generate thumbnails at multiple sizes
 * Safe to regenerate - overwrites existing thumbnails
 */
export async function handleThumbnailGeneration(payload: any, jobId: string): Promise<void> {
  const { imageId, originalPath, sizes } = payload;

  console.log(`[Thumbnail Handler] Generating thumbnails for: ${imageId}`, { sizes });

  // 1. Validate original file exists
  try {
    await fs.access(originalPath);
  } catch {
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
