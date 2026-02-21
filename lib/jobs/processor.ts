// Job Processor for serverless environments
// Processes pending jobs in batches without requiring persistent polling

import prisma from '@/lib/prisma'
import { JobHandler, registerJobHandler } from './runner'
import { handleOffloadOriginal, handleThumbnailGeneration, handlePreviewGeneration, handleExifEnrichment } from './handlers'

const LOCK_TIMEOUT_MS = 30000
const WORKER_ID = `serverless-${Date.now()}`

// Register handlers
const jobHandlers: Record<string, JobHandler> = {}

registerJobHandler('OFFLOAD_ORIGINAL', handleOffloadOriginal)
registerJobHandler('THUMBNAIL_GENERATION', handleThumbnailGeneration)
registerJobHandler('PREVIEW_GENERATION', handlePreviewGeneration)
registerJobHandler('EXIF_ENRICHMENT', handleExifEnrichment)

async function tryLockJob(jobId: string): Promise<boolean> {
  const now = new Date()
  const lockTimeout = new Date(now.getTime() - LOCK_TIMEOUT_MS)

  const result = await prisma.job.updateMany({
    where: {
      id: jobId,
      status: 'PENDING',
      OR: [
        { lockedAt: null },
        { lockedAt: { lt: lockTimeout } }
      ]
    },
    data: {
      status: 'RUNNING',
      lockedAt: now,
      lockedBy: WORKER_ID,
      attempts: { increment: 1 }
    }
  })

  return result.count > 0
}

async function completeJob(jobId: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      lockedAt: null,
      lockedBy: null
    }
  })
}

async function failJob(jobId: string, error: string, attempts: number, maxAttempts: number): Promise<void> {
  const shouldRetry = attempts < maxAttempts

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: shouldRetry ? 'PENDING' : 'FAILED',
      lastError: error,
      lockedAt: null,
      lockedBy: null
    }
  })
}

async function processJob(jobId: string, handlers: Record<string, JobHandler>): Promise<{ success: boolean; error?: string }> {
  const locked = await tryLockJob(jobId)
  if (!locked) {
    return { success: false, error: 'Could not acquire lock' }
  }

  try {
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) {
      return { success: false, error: 'Job not found' }
    }

    const handler = handlers[job.type]
    if (!handler) {
      throw new Error(`No handler for job type: ${job.type}`)
    }

    const payload = JSON.parse(job.payload)
    await handler(payload, jobId)
    await completeJob(jobId)

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (job) {
      await failJob(jobId, errorMessage, job.attempts, job.maxAttempts)
    }
    return { success: false, error: errorMessage }
  }
}

export interface ProcessResult {
  total: number
  processed: number
  succeeded: number
  failed: number
  errors: string[]
}

export async function processPendingJobs(batchSize: number = 5): Promise<ProcessResult> {
  const result: ProcessResult = {
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: []
  }

  const pendingJobs = await prisma.job.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: batchSize
  })

  result.total = pendingJobs.length

  if (pendingJobs.length === 0) {
    return result
  }

  console.log(`[Processor] Processing ${pendingJobs.length} pending jobs`)

  const outcomes = await Promise.all(
    pendingJobs.map(job => processJob(job.id, jobHandlers))
  )

  for (const outcome of outcomes) {
    result.processed++
    if (outcome.success) {
      result.succeeded++
    } else {
      result.failed++
      if (outcome.error) {
        result.errors.push(outcome.error)
      }
    }
  }

  return result
}

export { jobHandlers }
