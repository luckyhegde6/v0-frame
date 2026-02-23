// Phase 2: Job Handlers Index
// All job type handlers are exported here and registered with the job runner

import { registerJobHandler } from '@/lib/jobs/runner';
import { handleOffloadOriginal } from './offload-original';
import { handleThumbnailGeneration } from './thumbnail-generation';
import { handlePreviewGeneration } from './preview-generation';
import { handleExifEnrichment } from './exif-enrichment';
import { handleFaceDetection } from './face-detection';
import { handleObjectDetection } from './object-detection';
import { handleFaceGrouping } from './face-grouping';

/**
 * Initialize all job handlers
 * Called during application startup
 */
export function initializeJobHandlers() {
  console.log('[Job Handlers] Initializing handlers...');

  registerJobHandler('OFFLOAD_ORIGINAL', handleOffloadOriginal);
  registerJobHandler('THUMBNAIL_GENERATION', handleThumbnailGeneration);
  registerJobHandler('PREVIEW_GENERATION', handlePreviewGeneration);
  registerJobHandler('EXIF_ENRICHMENT', handleExifEnrichment);
  registerJobHandler('FACE_DETECTION', handleFaceDetection);
  registerJobHandler('OBJECT_DETECTION', handleObjectDetection);
  registerJobHandler('FACE_GROUPING', handleFaceGrouping);

  console.log('[Job Handlers] All handlers registered');
}

export { 
  handleOffloadOriginal, 
  handleThumbnailGeneration, 
  handlePreviewGeneration, 
  handleExifEnrichment,
  handleFaceDetection,
  handleObjectDetection,
  handleFaceGrouping
};
