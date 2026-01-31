// Phase 2: Job Runner Service
// See: .ai/contracts/phase-2-processing.md

import prisma from '@/lib/prisma';
import { JobStatus } from '@prisma/client';

const LOCK_TIMEOUT_MS = 30000; // 30 second lock timeout
const WORKER_ID = `worker-${process.pid}-${Date.now()}`;

export interface JobHandler {
  (payload: any, jobId: string): Promise<void>;
}

const jobHandlers: Record<string, JobHandler> = {};

/**
 * Register a job handler for a specific job type
 */
export function registerJobHandler(type: string, handler: JobHandler) {
  console.log(`[Job Runner] Registered handler for type: ${type}`);
  jobHandlers[type] = handler;
}

/**
 * Advisory lock using database updates
 * Returns true if lock acquired, false otherwise
 */
async function tryLockJob(jobId: string): Promise<boolean> {
  const now = new Date();
  const lockTimeout = new Date(now.getTime() - LOCK_TIMEOUT_MS);

  const result = await prisma.job.updateMany({
    where: {
      id: jobId,
      status: 'PENDING',
      OR: [
        { lockedAt: null },
        { lockedAt: { lt: lockTimeout } } // Lock expired
      ]
    },
    data: {
      status: 'RUNNING',
      lockedAt: now,
      lockedBy: WORKER_ID,
      attempts: {
        increment: 1
      }
    }
  });

  return result.count > 0;
}

/**
 * Release lock and mark job as completed
 */
async function completeJob(jobId: string) {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      lockedAt: null,
      lockedBy: null
    }
  });
}

/**
 * Release lock and mark job as failed, with optional retry
 */
async function failJob(jobId: string, error: string, jobRecord: any) {
  const shouldRetry = jobRecord.attempts < jobRecord.maxAttempts;

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: shouldRetry ? 'PENDING' : 'FAILED',
      lastError: error,
      lockedAt: null,
      lockedBy: null
    }
  });
}

/**
 * Process a single job
 */
async function processJob(jobId: string): Promise<void> {
  console.log(`[Job Runner] Processing job: ${jobId}`);

  // 1. Try to acquire lock
  const locked = await tryLockJob(jobId);
  if (!locked) {
    console.log(`[Job Runner] Could not acquire lock for job: ${jobId}`);
    return;
  }

  try {
    // 2. Fetch job details
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      console.error(`[Job Runner] Job not found: ${jobId}`);
      return;
    }

    // 3. Look up handler
    const handler = jobHandlers[job.type];
    if (!handler) {
      throw new Error(`No handler registered for job type: ${job.type}`);
    }

    // 4. Execute handler
    console.log(`[Job Runner] Executing handler for type: ${job.type}`);
    const payload = JSON.parse(job.payload);
    await handler(payload, jobId);

    // 5. Mark as completed
    await completeJob(jobId);
    console.log(`[Job Runner] Job completed: ${jobId}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Job Runner] Job failed: ${jobId}`, errorMessage);

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (job) {
      await failJob(jobId, errorMessage, job);
    }
  }
}

/**
 * Pull and process pending jobs
 * Runs continuously, fetching batches of jobs
 */
export async function startJobRunner(batchSize: number = 5, pollIntervalMs: number = 5000) {
  console.log(`[Job Runner] Starting with batchSize=${batchSize}, pollInterval=${pollIntervalMs}ms`);

  const runner = async () => {
    try {
      // Fetch pending jobs (FIFO by creation time)
      const pendingJobs = await prisma.job.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: batchSize
      });

      if (pendingJobs.length > 0) {
        console.log(`[Job Runner] Found ${pendingJobs.length} pending jobs`);
        // Process jobs in parallel (each with its own lock)
        await Promise.all(pendingJobs.map(job => processJob(job.id)));
      }

      // Schedule next poll
      setTimeout(runner, pollIntervalMs);
    } catch (error) {
      console.error('[Job Runner] Fatal error:', error);
      // Reschedule even on error
      setTimeout(runner, pollIntervalMs);
    }
  };

  // Start the runner
  runner();
}

/**
 * For testing: process all pending jobs once
 */
export async function runOnce(batchSize: number = 5) {
  const pendingJobs = await prisma.job.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: batchSize
  });

  if (pendingJobs.length > 0) {
    console.log(`[Job Runner] Running ${pendingJobs.length} pending jobs once`);
    await Promise.all(pendingJobs.map(job => processJob(job.id)));
  }
}
