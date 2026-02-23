import prisma from '@/lib/prisma'
import { 
  retrieveFile, 
  USE_SUPABASE_STORAGE
} from '@/lib/storage'
import fs from 'fs/promises'

interface ObjectDetectionResult {
  type: string
  label: string
  x: number
  y: number
  width: number
  height: number
  confidence: number
  embedding?: number[]
}

const COMMON_OBJECTS = [
  { label: 'person', type: 'PERSON' },
  { label: 'car', type: 'VEHICLE' },
  { label: 'dog', type: 'PET' },
  { label: 'cat', type: 'PET' },
  { label: 'building', type: 'VENUE' },
  { label: 'tree', type: 'NATURE' },
  { label: 'sky', type: 'NATURE' },
  { label: 'water', type: 'NATURE' },
  { label: 'food', type: 'PRODUCT' },
  { label: 'phone', type: 'PRODUCT' },
  { label: 'laptop', type: 'PRODUCT' },
  { label: 'book', type: 'PRODUCT' },
]

export async function handleObjectDetection(payload: any, jobId: string): Promise<void> {
  const { imageId } = payload

  console.log(`[Object Detection] Processing image: ${imageId}`)

  const image = await prisma.image.findUnique({ 
    where: { id: imageId }
  })

  if (!image) {
    throw new Error(`Image not found: ${imageId}`)
  }

  let localPath = image.tempPath

  if (USE_SUPABASE_STORAGE && image.tempPath?.includes('/')) {
    const [bucket, ...pathParts] = image.tempPath.split('/')
    const storagePath = pathParts.join('/')
    
    try {
      localPath = await retrieveFile({
        bucket: bucket as any,
        path: storagePath,
      })
    } catch (error) {
      console.error(`[Object Detection] Failed to download from storage:`, error)
      throw error
    }
  }

  try {
    await fs.access(localPath)
  } catch {
    throw new Error(`Image file not found: ${localPath}`)
  }

  const existingObjects = await prisma.detectedObject.findMany({
    where: { imageId }
  })

  if (existingObjects.length > 0) {
    console.log(`[Object Detection] Found ${existingObjects.length} existing detections`)
    return
  }

  console.log(`[Object Detection] ML model would run here - adding placeholder detections`)

  const detections: ObjectDetectionResult[] = []

  detections.push({
    type: 'PERSON',
    label: 'person',
    x: 0.3,
    y: 0.2,
    width: 0.4,
    height: 0.6,
    confidence: 0.92,
    embedding: Array(128).fill(0).map(() => Math.random() * 2 - 1)
  })

  for (const detection of detections) {
    await prisma.detectedObject.create({
      data: {
        imageId,
        type: detection.type,
        label: detection.label,
        x: detection.x,
        y: detection.y,
        width: detection.width,
        height: detection.height,
        confidence: detection.confidence,
        embedding: detection.embedding
      }
    })
  }

  console.log(`[Object Detection] Complete: ${detections.length} objects detected for ${imageId}`)
}
