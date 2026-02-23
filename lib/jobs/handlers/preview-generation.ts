import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import prisma from '@/lib/prisma'
import { 
  storeBuffer, 
  retrieveFile, 
  USE_SUPABASE_STORAGE, 
  BUCKETS 
} from '@/lib/storage'

// Get project root tmp folder
function getProjectTmp(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return '/tmp'
  }
  return path.resolve(process.cwd(), 'tmp')
}

export async function handlePreviewGeneration(payload: any, jobId: string): Promise<void> {
  const { imageId, originalPath } = payload

  console.log(`[Preview Handler] Generating preview for: ${imageId}`)
  console.log(`[Preview Handler] Using Supabase Storage: ${USE_SUPABASE_STORAGE}`)

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
    
    console.log(`[Preview Handler] Downloading from Supabase: ${bucket}/${storagePath}`)
    
    try {
      localPath = await retrieveFile({
        bucket: bucket as any,
        path: storagePath,
      })
      console.log(`[Preview Handler] Downloaded to: ${localPath}`)
    } catch (error) {
      console.error(`[Preview Handler] Failed to download:`, error)
      throw error
    }
  }

  try {
    await fs.access(localPath)
  } catch {
    throw new Error(`Original image not found at: ${localPath}`)
  }

  try {
    const metadata = await sharp(localPath).metadata()
    const maxDimension = Math.max(metadata.width || 0, metadata.height || 0)
    
    let transform = sharp(localPath)

    if (maxDimension > 2000) {
      transform = transform.resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      })
    }

    const previewBuffer = await transform
      .jpeg({ quality: 85, progressive: true })
      .toBuffer()

    const previewPath = `${imageId}/preview.jpg`
    let finalPath: string

    if (USE_SUPABASE_STORAGE) {
      const result = await storeBuffer(previewBuffer, {
        bucket: BUCKETS.PROCESSED,
        path: previewPath,
        contentType: 'image/jpeg',
      })
      finalPath = result.publicUrl || result.fullPath
      console.log(`[Preview Handler] Uploaded to: ${result.publicUrl}`)
    } else {
      const projectTmp = getProjectTmp()
      const previewDir = path.join(
        projectTmp, 
        'storage', 
        'processed', 
        imageId
      )
      await fs.mkdir(previewDir, { recursive: true })
      const localPreviewPath = path.join(previewDir, 'preview.jpg')
      await fs.writeFile(localPreviewPath, previewBuffer)
      finalPath = localPreviewPath
      console.log(`[Preview Handler] Created: ${localPreviewPath}`)
    }

    const image = await prisma.image.findUnique({ where: { id: imageId } })
    const shouldMarkStored = !!image?.thumbnailPath

    await prisma.image.update({
      where: { id: imageId },
      data: {
        previewPath: finalPath,
        status: shouldMarkStored ? 'STORED' : 'PROCESSING'
      }
    })

    console.log(`[Preview Handler] Preview complete: ${imageId}`)
  } catch (error) {
    console.error(`[Preview Handler] Failed to generate preview:`, error)
    throw error
  }
}
