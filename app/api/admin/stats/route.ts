import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logCritical } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [
      totalUsers,
      totalImages,
      totalJobs,
      totalCollections,
      totalProjects,
      jobsPending,
      jobsRunning,
      jobsCompleted,
      jobsFailed,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.image.count(),
      prisma.job.count(),
      prisma.collection.count(),
      prisma.project.count(),
      prisma.job.count({ where: { status: 'PENDING' } }),
      prisma.job.count({ where: { status: 'RUNNING' } }),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.job.count({ where: { status: 'FAILED' } }),
    ])

    const images = await prisma.image.findMany({
      select: { sizeBytes: true }
    })

    const totalSize = images.reduce((acc, img) => acc + img.sizeBytes, 0)

    return NextResponse.json({
      database: {
        totalUsers,
        totalImages,
        totalJobs,
        totalCollections,
        totalProjects,
      },
      jobs: {
        pending: jobsPending,
        running: jobsRunning,
        completed: jobsCompleted,
        failed: jobsFailed,
      },
      storage: {
        totalSize,
        tempSize: totalSize,
      },
    })
  } catch (error) {
    logCritical('Failed to fetch stats', 'AdminStatsAPI', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
