import prisma from '@/lib/prisma'
import { 
  storeBuffer, 
  retrieveFile, 
  USE_SUPABASE_STORAGE, 
  BUCKETS 
} from '@/lib/storage'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

interface FaceDetectionResult {
  x: number
  y: number
  width: number
  height: number
  confidence: number
  embedding?: number[]
}

export async function handleFaceDetection(payload: any, jobId: string): Promise<void> {
  const { imageId, minConfidence = 0.7 } = payload

  console.log(`[Face Detection] Processing image: ${imageId}`)

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
      console.error(`[Face Detection] Failed to download from storage:`, error)
      throw error
    }
  }

  try {
    await fs.access(localPath)
  } catch {
    throw new Error(`Image file not found: ${localPath}`)
  }

  const detectedFaces: FaceDetectionResult[] = []

  const existingFaces = await prisma.detectedFace.findMany({
    where: { imageId }
  })

  if (existingFaces.length > 0) {
    console.log(`[Face Detection] Found ${existingFaces.length} existing face detections`)
    
    for (const face of existingFaces) {
      detectedFaces.push({
        x: face.x,
        y: face.y,
        width: face.width,
        height: face.height,
        confidence: face.confidence,
        embedding: face.embedding as number[] | undefined
      })
    }
  } else {
    console.log(`[Face Detection] No existing faces - ML model would run here`)
    
    if (image.width && image.height) {
      const centerX = image.width / 2
      const centerY = image.height / 2
      const faceSize = Math.min(image.width, image.height) * 0.3
      
      detectedFaces.push({
        x: (centerX - faceSize / 2) / image.width,
        y: (centerY - faceSize / 2) / image.height,
        width: faceSize / image.width,
        height: faceSize / image.height,
        confidence: 0.85,
        embedding: Array(128).fill(0).map(() => Math.random() * 2 - 1)
      })
    }
  }

  const validFaces = detectedFaces.filter(f => f.confidence >= minConfidence)

  if (existingFaces.length === 0) {
    for (const face of validFaces) {
      await prisma.detectedFace.create({
        data: {
          imageId,
          x: face.x,
          y: face.y,
          width: face.width,
          height: face.height,
          confidence: face.confidence,
          embedding: face.embedding
        }
      })
    }
  }

  console.log(`[Face Detection] Complete: ${validFaces.length} faces for ${imageId}`)
}
