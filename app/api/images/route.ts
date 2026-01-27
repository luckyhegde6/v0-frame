import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const [images, collections, pendingJobs] = await Promise.all([
      prisma.image.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          status: 'INGESTED',
        },
        include: {
          collections: true
        }
      }),
      prisma.collection.findMany({
        include: {
          _count: {
            select: { images: true }
          }
        }
      }),
      prisma.job.findMany({
        where: {
          status: 'PENDING',
          type: 'OFFLOAD_ORIGINAL'
        }
      })
    ])

    return NextResponse.json({
      data: images.map((img: any) => ({
        ...img,
        // In Phase 1, an image is "Syncing" if there is a pending offload job for its ID
        isSyncing: pendingJobs.some(job => job.payload.includes(img.id))
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
