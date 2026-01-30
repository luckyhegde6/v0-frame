import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Phase 2: Include all image statuses, not just INGESTED
    const [images, collections, jobsByImageId] = await Promise.all([
      prisma.image.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          collections: true,
          jobs: {
            where: { status: { in: ['PENDING', 'RUNNING'] } },
            select: { id: true, type: true, status: true }
          }
        }
      }),
      prisma.collection.findMany({
        include: {
          _count: {
            select: { images: true }
          }
        }
      }),
      // Get all processing jobs for quick reference
      prisma.job.findMany({
        where: {
          status: { in: ['PENDING', 'RUNNING'] }
        },
        select: { id: true, imageId: true, type: true, status: true }
      })
    ])

    // Create lookup map for jobs by imageId
    const jobsByImageMap = new Map<string, typeof jobsByImageId>();
    jobsByImageId.forEach(job => {
      if (!job.imageId) return;
      if (!jobsByImageMap.has(job.imageId)) {
        jobsByImageMap.set(job.imageId, []);
      }
      jobsByImageMap.get(job.imageId)?.push(job);
    });

    return NextResponse.json({
      data: images.map((img: any) => ({
        ...img,
        // Phase 2: Include processing status
        processingJobs: jobsByImageMap.get(img.id) || [],
        isProcessing: img.status === 'PROCESSING',
        isStored: img.status === 'STORED',
        // Phase 1 compat: backwards-compatible isSyncing flag
        isSyncing: img.status === 'PROCESSING' || img.jobs.length > 0
      })),
      collections: collections.map((c: any) => ({
        id: c.id,
        name: c.name,
        count: c._count.images
      })),
      count: images.length,
    })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch images' },
      { status: 500 }
    )
  }
}
