// Phase 2: Preview Generation Handler
// Generates web-optimized preview image using Sharp

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import prisma from '@/lib/prisma';

const STORAGE_DIR = process.env.STORAGE_DIR || '/tmp/storage';

/**
 * Generate web-optimized preview image
 * Maximum 2000px, JPEG quality 85, progressive
 * Safe to regenerate - overwrites existing preview
 */
export async function handlePreviewGeneration(payload: any, jobId: string): Promise<void> {
  const { imageId, originalPath } = payload;

  console.log(`[Preview Handler] Generating preview for: ${imageId}`);

  // 1. Validate original file exists
  try {
    await fs.access(originalPath);
  } catch {
    throw new Error(`Original image not found at: ${originalPath}`);
  }

  // 2. Ensure preview directory exists
  const previewDir = path.join(STORAGE_DIR, 'previews', imageId);
  await fs.mkdir(previewDir, { recursive: true });

  // 3. Generate preview
  const previewPath = path.join(previewDir, 'preview.jpg');

  console.log(`[Preview Handler] Creating preview: ${previewPath}`);

  try {
    // Get original metadata to determine scaling
    const metadata = await sharp(originalPath).metadata();
    const maxDimension = Math.max(metadata.width || 0, metadata.height || 0);
    
    let transform = sharp(originalPath);

    // Only resize if larger than max preview size
    if (maxDimension > 2000) {
      transform = transform.resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    await transform
      .jpeg({ quality: 85, progressive: true })
      .toFile(previewPath);

    console.log(`[Preview Handler] Preview created: ${previewPath}`);
  } catch (error) {
    console.error(`[Preview Handler] Failed to generate preview:`, error);
    throw error;
  }

  // 4. Update image record with preview path
  console.log(`[Preview Handler] Updating image record with preview path: ${imageId}`);
  
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  
  // Check if this is the last derived asset job to complete
  // If both thumbnail and preview are done, mark image as STORED
  const shouldMarkStored = !!image?.thumbnailPath;

  await prisma.image.update({
    where: { id: imageId },
    data: {
      previewPath: previewPath,
      status: shouldMarkStored ? 'STORED' : 'PROCESSING'
    }
  });

  console.log(`[Preview Handler] Preview complete: ${imageId}`);
}
