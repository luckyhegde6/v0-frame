import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logCritical } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter')

    const whereClause: any = {}
    
    if (filter === 'labelled') {
      whereClause.label = { not: null }
    } else if (filter === 'unlabelled') {
      whereClause.label = null
    }

    const faceGroups = await prisma.faceGroup.findMany({
      where: whereClause,
      include: {
        album: {
          select: { name: true }
        },
        faces: {
          include: {
            image: {
              select: {
                id: true,
                thumbnailPath: true
              }
            }
          },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ faceGroups })
  } catch (error) {
    logCritical('Failed to fetch face groups', 'FacesAPI', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch face groups' },
      { status: 500 }
    )
  }
}
