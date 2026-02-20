import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import sharp from 'sharp'
import prisma from '@/lib/prisma'
import { 
  storeBuffer, 
  retrieveFile, 
  USE_SUPABASE_STORAGE, 
  BUCKETS,
  getFileUrl 
} from '@/lib/storage'

const SIZES = [128, 256, 512]

export async function handleThumbnailGeneration(payload: any, jobId: string): Promise<void> {
  let { imageId, originalPath } = payload

  console.log(`[Thumbnail Handler] Generating thumbnails for: ${imageId}`)
  console.log(`[Thumbnail Handler] Using Supabase Storage: ${USE_SUPABASE_STORAGE}`)

  let localPath = originalPath

  if (USE_SUPABASE_STORAGE && originalPath.includes('/')) {
    const [bucket, ...pathParts] = originalPath.split('/')
    const storagePath = pathParts.join('/')
    
    console.log(`[Thumbnail Handler] Downloading from Supabase: ${bucket}/${storagePath}`)
    
    try {
      localPath = await retrieveFile({
        bucket: bucket as any,
        path: storagePath,
      })
      console.log(`[Thumbnail Handler] Downloaded to: ${localPath}`)
    } catch (error) {
      console.error(`[Thumbnail Handler] Failed to download:`, error)
      await prisma.image.update({
        where: { id: imageId },
        data: { status: 'FAILED' }
      })
      throw error
    }
  } else {
    try {
      await fs.access(originalPath)
    } catch {
      const tempLocations = [
        path.join(process.env.VERCEL ? '/tmp' : os.tmpdir(), 'ingest', path.basename(originalPath)),
        path.join(process.env.VERCEL ? '/tmp' : os.tmpdir(), 'v0-frame', 'ingest', path.basename(originalPath)),
      ]
      
      for (const loc of tempLocations) {
        try {
          await fs.access(loc)
          localPath = loc
          break
        } catch {}
      }
    }
  }

  try {
    await fs.access(localPath)
  } catch {
    await prisma.image.update({
      where: { id: imageId },
      data: { status: 'FAILED' }
    })
    throw new Error(`Original image not found at: ${localPath}`)
  }

  const thumbnailPaths: Record<number, string> = {}

  for (const size of SIZES) {
    try {
      const thumbBuffer = await sharp(localPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer()

      const thumbPath = `${imageId}/thumb-${size}.jpg`

      if (USE_SUPABASE_STORAGE) {
        const result = await storeBuffer(thumbBuffer, {
          bucket: BUCKETS.THUMBNAILS,
          path: thumbPath,
          contentType: 'image/jpeg',
        })
        thumbnailPaths[size] = result.publicUrl || result.fullPath
        console.log(`[Thumbnail Handler] Uploaded ${size}px: ${result.publicUrl}`)
      } else {
        const localThumbDir = path.join(
          process.env.STORAGE_DIR || '/tmp/storage', 
          'thumbnails', 
          imageId
        )
        await fs.mkdir(localThumbDir, { recursive: true })
        const localThumbPath = path.join(localThumbDir, `thumb-${size}.jpg`)
        await fs.writeFile(localThumbPath, thumbBuffer)
        thumbnailPaths[size] = localThumbPath
        console.log(`[Thumbnail Handler] Created ${size}px: ${localThumbPath}`)
      }
    } catch (error) {
      console.error(`[Thumbnail Handler] Failed to generate ${size}px thumbnail:`, error)
      throw error
    }
  }

  const smallestSize = Math.min(...SIZES)
  const thumbnailPath = thumbnailPaths[smallestSize]

  const image = await prisma.image.findUnique({ where: { id: imageId } })
  const shouldMarkStored = !!image?.previewPath

  await prisma.image.update({
    where: { id: imageId },
    data: {
      thumbnailPath: thumbnailPath,
      status: shouldMarkStored ? 'STORED' : 'PROCESSING'
    }
  })

  console.log(`[Thumbnail Handler] Thumbnails complete: ${imageId}`)
}
