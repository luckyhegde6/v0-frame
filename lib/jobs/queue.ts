// Phase 1 & 2: Job Enqueue Contract
// See: .ai/contracts/phase-1-ingestion.md §6 & .ai/contracts/phase-2-processing.md

import prisma from '@/lib/prisma';
import { logJobCreated } from '@/lib/audit';

export interface OffloadJob {
    type: 'OFFLOAD_ORIGINAL';
    imageId: string;
    tempPath: string;
    checksum: string;
}

export interface ThumbnailJob {
    type: 'THUMBNAIL_GENERATION';
    imageId: string;
    originalPath: string;
    sizes: number[];
}

export interface PreviewJob {
    type: 'PREVIEW_GENERATION';
    imageId: string;
    originalPath: string;
}

export interface ExifJob {
    type: 'EXIF_ENRICHMENT';
    imageId: string;
    originalPath: string;
}

/**
 * Enqueues a job for offloading
 * Contract §6: Job enqueue is fire-and-forget.
 * Phase 2: Associates job with image for state tracking
 */
export async function enqueueOffloadJob(job: OffloadJob): Promise<void> {
    console.log('[Job Enqueue] Queueing offload job:', {
        type: job.type,
        imageId: job.imageId
    });

    const createdJob = await prisma.job.create({
        data: {
            type: job.type,
            payload: JSON.stringify(job),
            status: 'PENDING',
            imageId: job.imageId,
            maxAttempts: 3
        }
    });

    await logJobCreated(createdJob.id, 'system', job.type);
}

/**
 * Enqueue thumbnail generation job
 */
export async function enqueueThumbnailJob(imageId: string, originalPath: string): Promise<void> {
    console.log('[Job Enqueue] Queueing thumbnail job:', { imageId });

    const createdJob = await prisma.job.create({
        data: {
            type: 'THUMBNAIL_GENERATION',
            payload: JSON.stringify({
                type: 'THUMBNAIL_GENERATION',
                imageId,
                originalPath,
                sizes: [64, 128, 256, 512]
            }),
            status: 'PENDING',
            imageId,
            maxAttempts: 3
        }
    });

    await logJobCreated(createdJob.id, 'system', 'THUMBNAIL_GENERATION');
}

/**
 * Enqueue preview generation job
 */
export async function enqueuePreviewJob(imageId: string, originalPath: string): Promise<void> {
    console.log('[Job Enqueue] Queueing preview job:', { imageId });

    const createdJob = await prisma.job.create({
        data: {
            type: 'PREVIEW_GENERATION',
            payload: JSON.stringify({
                type: 'PREVIEW_GENERATION',
                imageId,
                originalPath
            }),
            status: 'PENDING',
            imageId,
            maxAttempts: 3
        }
    });

    await logJobCreated(createdJob.id, 'system', 'PREVIEW_GENERATION');
}

/**
 * Enqueue EXIF enrichment job
 */
export async function enqueueExifJob(imageId: string, originalPath: string): Promise<void> {
    console.log('[Job Enqueue] Queueing EXIF job:', { imageId });

    const createdJob = await prisma.job.create({
        data: {
            type: 'EXIF_ENRICHMENT',
            payload: JSON.stringify({
                type: 'EXIF_ENRICHMENT',
                imageId,
                originalPath
            }),
            status: 'PENDING',
            imageId,
            maxAttempts: 3
        }
    });

    await logJobCreated(createdJob.id, 'system', 'EXIF_ENRICHMENT');
}
