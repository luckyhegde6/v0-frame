import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed health check for all services
 *     description: Returns detailed health status including database, storage, jobs, and system metrics (Admin only)
 *     tags: [Health]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Detailed health information
 *       403:
 *         description: Forbidden - Admin access required
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    )
  }

  const services: Record<string, { status: string; details?: string }> = {}
  const metrics: Record<string, unknown> = {}

  try {
    const [userCount, imageCount, projectCount, jobCount] = await Promise.all([
      prisma.user.count(),
      prisma.image.count(),
      prisma.project.count(),
      prisma.job.count()
    ])

    const pendingJobs = await prisma.job.count({
      where: { status: 'PENDING' }
    })

    const failedJobs = await prisma.job.count({
      where: { status: 'FAILED' }
    })

    services.database = { status: 'healthy' }
    services.jobs = { status: 'healthy' }
    services.system = { status: 'healthy' }

    metrics.users = userCount
    metrics.images = imageCount
    metrics.projects = projectCount
    metrics.jobs = {
      total: jobCount,
      pending: pendingJobs,
      failed: failedJobs
    }

    const memUsage = process.memoryUsage()
    metrics.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
    }
    metrics.cpu = process.cpuUsage()
    metrics.uptime = process.uptime()

  } catch (error) {
    services.database = {
      status: 'unhealthy',
      details: error instanceof Error ? error.message : 'Database error'
    }
  }

  const allHealthy = Object.values(services).every(s => s.status === 'healthy')

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services,
    metrics
  }, {
    status: allHealthy ? 200 : 503
  })
}
