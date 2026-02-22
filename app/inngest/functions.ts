import { inngest } from '@/lib/inngest/client'
import { handleOffloadOriginal, handleThumbnailGeneration, handlePreviewGeneration, handleExifEnrichment } from '@/lib/jobs/handlers'

// Job processing functions for Inngest
export const processOffloadJob = inngest.createFunction(
  { id: 'offload-original' },
  { event: 'job/offload-original' },
  async ({ event, step }) => {
    await step.run('process', async () => {
      await handleOffloadOriginal(event.data, event.data.jobId)
    })
    return { success: true, jobId: event.data.jobId }
  }
)

export const processThumbnailJob = inngest.createFunction(
  { id: 'thumbnail-generation' },
  { event: 'job/thumbnail-generation' },
  async ({ event, step }) => {
    await step.run('process', async () => {
      await handleThumbnailGeneration(event.data, event.data.jobId)
    })
    return { success: true, jobId: event.data.jobId }
  }
)

export const processPreviewJob = inngest.createFunction(
  { id: 'preview-generation' },
  { event: 'job/preview-generation' },
  async ({ event, step }) => {
    await step.run('process', async () => {
      await handlePreviewGeneration(event.data, event.data.jobId)
    })
    return { success: true, jobId: event.data.jobId }
  }
)

export const processExifJob = inngest.createFunction(
  { id: 'exif-enrichment' },
  { event: 'job/exif-enrichment' },
  async ({ event, step }) => {
    await step.run('process', async () => {
      await handleExifEnrichment(event.data, event.data.jobId)
    })
    return { success: true, jobId: event.data.jobId }
  }
)

// Job queue processor - processes pending jobs from database
export const processJobQueue = inngest.createFunction(
  { id: 'process-job-queue' },
  { event: 'cron/process-jobs' },
  async ({ event, step }) => {
    const { processPendingJobs } = await import('@/lib/jobs/processor')
    const result = await step.run('process-pending', async () => {
      return await processPendingJobs(5)
    })
    return result
  }
)

// Hello world test function
export const helloWorld = inngest.createFunction(
  { id: 'hello-world' },
  { event: 'test/hello.world' },
  async ({ event, step }) => {
    await step.sleep('wait-a-moment', '1s')
    return { message: `Hello ${event.data.email || 'World'}!` }
  }
)

// Export all functions for Inngest serve
export const inngestFunctions = [
  processOffloadJob,
  processThumbnailJob,
  processPreviewJob,
  processExifJob,
  processJobQueue,
  helloWorld,
]
