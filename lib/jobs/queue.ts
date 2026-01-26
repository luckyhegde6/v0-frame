// Phase 1 Contract: Job Enqueue Contract (Offload Stub)
// See: .ai/contracts/phase-1-ingestion.md §6

import prisma from '@/lib/prisma';

export interface OffloadJob {
    type: 'OFFLOAD_ORIGINAL';
    imageId: string;
    tempPath: string;
    checksum: string;
}

/**
 * Enqueues a job for offloading
 * Contract §6: Job enqueue is fire-and-forget.
 */
export async function enqueueOffloadJob(job: OffloadJob): Promise<void> {
    // 1. Log for Phase 1 observability requirement
    console.log('[Job Enqueue] Queueing offload job:', {
        type: job.type,
        imageId: job.imageId
    });

    // 2. Persist job to DB for Phase 2 worker to pick up
    // "Job creation failure = upload failure" (Caller handles error)
    await prisma.job.create({
        data: {
            type: job.type,
            payload: JSON.stringify(job),
            status: 'PENDING'
        }
    });

    // Note: We do NOT await execution here. Phase 1 only enqueues.
}
