import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: taskId } = await params
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const task = await prisma.adminTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.status !== 'QUEUED') {
      return NextResponse.json(
        { error: 'Task must be in QUEUED status to start' },
        { status: 400 }
      )
    }

    const payload = task.payload as Record<string, any> || {}
    const jobs: { id: string; type: string }[] = []

    // Map task type to job creation
    switch (task.type) {
      case 'COMPRESS_IMAGES': {
        const imageIds = await getImageIdsFromPayload(payload)
        for (const imageId of imageIds) {
          const job = await prisma.job.create({
            data: {
              type: 'IMAGE_COMPRESS',
              payload: JSON.stringify({
                imageId,
                quality: payload.quality || 'medium',
                maxWidth: payload.maxWidth || 2000,
                maxHeight: payload.maxHeight || 2000,
                preserveOriginal: payload.preserveOriginal !== false
              }),
              status: 'PENDING',
              imageId
            }
          })
          jobs.push({ id: job.id, type: job.type })
        }
        break
      }

      case 'GENERATE_THUMBNAILS': {
        const imageIds = await getImageIdsFromPayload(payload)
        for (const imageId of imageIds) {
          const sizes = payload.sizes === 'small' ? [128, 256] 
            : payload.sizes === 'large' ? [512, 1024] 
            : [128, 256, 512, 1024]
          
          for (const size of sizes) {
            const job = await prisma.job.create({
              data: {
                type: 'THUMBNAIL_GENERATION',
                payload: JSON.stringify({
                  imageId,
                  size,
                  overwrite: payload.overwrite || false
                }),
                status: 'PENDING',
                imageId
              }
            })
            jobs.push({ id: job.id, type: job.type })
          }
        }
        break
      }

      case 'REGENERATE_METADATA': {
        const imageIds = await getImageIdsFromPayload(payload)
        for (const imageId of imageIds) {
          const job = await prisma.job.create({
            data: {
              type: 'EXIF_ENRICHMENT',
              payload: JSON.stringify({
                imageId,
                extractGPS: payload.extractGPS !== false,
                extractCamera: payload.extractCamera !== false,
                overwrite: payload.overwrite || false
              }),
              status: 'PENDING',
              imageId
            }
          })
          jobs.push({ id: job.id, type: job.type })
        }
        break
      }

      case 'SYNC_STORAGE': {
        const job = await prisma.job.create({
          data: {
            type: 'STORAGE_SYNC',
            payload: JSON.stringify({
              direction: payload.direction || 'upload',
              deleteAfterSync: payload.deleteAfterSync || false
            }),
            status: 'PENDING'
          }
        })
        jobs.push({ id: job.id, type: job.type })
        break
      }

      case 'FACE_RECOGNITION': {
        if (payload.albumId) {
          const images = await prisma.image.findMany({
            where: { albumId: payload.albumId, status: 'STORED' },
            select: { id: true }
          })
          for (const img of images) {
            const job = await prisma.job.create({
              data: {
                type: 'FACE_RECOGNITION',
                payload: JSON.stringify({
                  imageId: img.id,
                  albumId: payload.albumId
                }),
                status: 'PENDING',
                imageId: img.id
              }
            })
            jobs.push({ id: job.id, type: job.type })
          }
        }
        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown task type: ${task.type}` },
          { status: 400 }
        )
    }

    // Update task status
    await prisma.adminTask.update({
      where: { id: taskId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        progress: 0
      }
    })

    return NextResponse.json({
      success: true,
      jobsCreated: jobs.length,
      jobs: jobs.slice(0, 10) // Return first 10 for reference
    })

  } catch (error) {
    console.error('[TaskStartAPI] Error:', error)
    return NextResponse.json(
      { error: 'Failed to start task' },
      { status: 500 }
    )
  }
}

async function getImageIdsFromPayload(payload: Record<string, any>): Promise<string[]> {
  if (payload.sourceImageIds?.length) {
    return payload.sourceImageIds
  }

  if (payload.sourceAlbumId) {
    const images = await prisma.image.findMany({
      where: { albumId: payload.sourceAlbumId, status: 'STORED' },
      select: { id: true }
    })
    return images.map(img => img.id)
  }

  if (payload.sourceProjectId) {
    const albums = await prisma.album.findMany({
      where: { projectId: payload.sourceProjectId },
      select: { id: true }
    })
    const albumIds = albums.map(a => a.id)
    const images = await prisma.image.findMany({
      where: { albumId: { in: albumIds }, status: 'STORED' },
      select: { id: true }
    })
    return images.map(img => img.id)
  }

  return []
}
