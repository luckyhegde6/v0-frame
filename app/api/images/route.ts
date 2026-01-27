import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const [images, collections] = await Promise.all([
      prisma.image.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          status: 'INGESTED',
        },
      }),
      prisma.collection.findMany({
        include: {
          _count: {
            select: { images: true }
          }
        }
      })
    ])

    return NextResponse.json({
      data: images,
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
