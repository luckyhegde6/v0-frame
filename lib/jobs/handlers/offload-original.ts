import fs from 'fs/promises'
import prisma from '@/lib/prisma'
import { enqueueThumbnailJob, enqueuePreviewJob, enqueueExifJob } from '@/lib/jobs/queue'
import { 
  storeFile, 
  USE_SUPABASE_STORAGE, 
  BUCKETS,
  type BucketName 
} from '@/lib/storage'

export async function handleOffloadOriginal(payload: any, jobId: string): Promise<void> {
  const { imageId, tempPath, checksum } = payload

  console.log(`[Offload Handler] Processing image: ${imageId}`)
  console.log(`[Offload Handler] Using Supabase Storage: ${USE_SUPABASE_STORAGE}`)

  const image = await prisma.image.findUnique({
    where: { id: imageId },
    include: { album: true }
  })

  if (!image) {
    throw new Error(`Image not found: ${imageId}`)
  }

  let finalPath = tempPath
  let storageBucket: BucketName | null = null
  let storagePath: string | null = null

  if (USE_SUPABASE_STORAGE) {
    console.log(`[Offload Handler] Uploading to Supabase Storage...`)

    try {
      const extension = tempPath.split('.').pop() || 'bin'
      
      let bucket: BucketName
      let destPath: string

      if (image.storageType === 'ALBUM' && image.albumId && image.album?.projectId) {
        bucket = BUCKETS.PROJECT_ALBUMS
        destPath = `projects/${image.album.projectId}/albums/${image.albumId}/${imageId}.${extension}`
      } else {
        bucket = BUCKETS.USER_GALLERY
        destPath = `${image.userId}/Gallery/images/${imageId}.${extension}`
      }

      const result = await storeFile(tempPath, {
        bucket,
        path: destPath,
        contentType: image.mimeType,
      })

      storageBucket = bucket
      storagePath = destPath
      finalPath = result.publicUrl || result.fullPath

      console.log(`[Offload Handler] Uploaded to: ${result.fullPath}`)
      console.log(`[Offload Handler] Public URL: ${result.publicUrl}`)

      await fs.unlink(tempPath).catch(() => {})
      console.log(`[Offload Handler] Cleaned up temp file: ${tempPath}`)

    } catch (error) {
      console.error(`[Offload Handler] Failed to upload to Supabase:`, error)
      throw error
    }
  }

  await prisma.image.update({
    where: { id: imageId },
    data: {
      status: 'PROCESSING',
      tempPath: USE_SUPABASE_STORAGE && storagePath ? `${storageBucket}/${storagePath}` : tempPath,
    }
  })

  console.log(`[Offload Handler] Image status updated to PROCESSING: ${imageId}`)

  console.log(`[Offload Handler] Enqueueing derived asset jobs: ${imageId}`)
  
  const pathForJobs = USE_SUPABASE_STORAGE && storagePath 
    ? `${storageBucket}/${storagePath}` 
    : tempPath

  await enqueueThumbnailJob(imageId, pathForJobs)
  await enqueuePreviewJob(imageId, pathForJobs)
  await enqueueExifJob(imageId, pathForJobs)

  console.log(`[Offload Handler] Job complete: ${imageId}`)
}
