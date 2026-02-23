import fs from 'fs/promises'
import path from 'path'
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

// Get project root tmp folder
function getProjectTmp(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return '/tmp'
  }
  return path.resolve(process.cwd(), 'tmp')
}

export async function handleThumbnailGeneration(payload: any, jobId: string): Promise<void> {
  let { imageId, originalPath } = payload

  console.log(`[Thumbnail Handler] Generating thumbnails for: ${imageId}`)
  console.log(`[Thumbnail Handler] Using Supabase Storage: ${USE_SUPABASE_STORAGE}`)

  let localPath = originalPath

  if (USE_SUPABASE_STORAGE) {
    // Handle both formats: full URL, bucket/path, or just path
    let bucket: string
    let storagePath: string
    
    if (originalPath.startsWith('http')) {
      // Full URL - extract bucket and path
      const urlMatch = originalPath.match(/object\/(?:public\/)?([^/]+)\/(.+)$/)
      if (urlMatch) {
        bucket = urlMatch[1]
        storagePath = urlMatch[2]
      } else {
        throw new Error(`Failed to parse URL: ${originalPath}`)
      }
    } else if (originalPath.includes('/')) {
      // bucket/path format
      const [b, ...pathParts] = originalPath.split('/')
      bucket = b
      storagePath = pathParts.join('/')
    } else {
      // Just path - assume project-albums bucket (common case)
      bucket = 'project-albums'
      storagePath = originalPath
    }
    
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
      const projectTmp = getProjectTmp()
      const tempLocations = [
        path.join(projectTmp, 'ingest', path.basename(originalPath)),
        path.join(projectTmp, 'storage', 'projects', path.basename(originalPath)),
        path.join(process.env.VERCEL ? '/tmp' : projectTmp, 'ingest', path.basename(originalPath)),
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
        const projectTmp = getProjectTmp()
        const localThumbDir = path.join(
          projectTmp, 
          'storage', 
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
