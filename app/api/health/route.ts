import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of all services
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                     storage:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                     memory:
 *                       type: object
 *                       properties:
 *                           type: string
 *                     uptime:
 *                       type: number
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const services: Record<string, { status: string; responseTime?: number; details?: string }> = {}
  let overallStatus = 'healthy'

  // Check database connection
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    services.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart
    }
  } catch (error) {
    services.database = {
      status: 'unhealthy',
      details: error instanceof Error ? error.message : 'Database connection failed'
    }
    overallStatus = 'degraded'
  }

  // Check storage (temp directory)
  try {
    const { existsSync } = await import('fs')
    const { tempDir } = await import('@/lib/storage/temp')
    const storagePath = tempDir
    if (existsSync(storagePath)) {
      services.storage = { status: 'healthy' }
    } else {
      services.storage = { status: 'unhealthy', details: 'Storage directory not accessible' }
      overallStatus = 'degraded'
    }
  } catch (error) {
    services.storage = {
      status: 'unhealthy',
      details: error instanceof Error ? error.message : 'Storage check failed'
    }
    overallStatus = 'degraded'
  }

  // Memory usage
  try {
    const memUsage = process.memoryUsage()
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
    
    services.memory = {
      status: heapUsedPercent > 90 ? 'unhealthy' : heapUsedPercent > 75 ? 'warning' : 'healthy',
      details: `Heap: ${Math.round(heapUsedPercent)}%`
    }
    
    if (services.memory.status === 'unhealthy') {
      overallStatus = 'degraded'
    }
  } catch (error) {
    services.memory = { status: 'unknown' }
  }

  // Uptime
  const uptime = process.uptime()
  services.uptime = {
    status: 'healthy',
    details: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`
  }

  const responseTime = Date.now() - startTime

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime,
    services
  }

  return NextResponse.json(response, {
    status: overallStatus === 'healthy' ? 200 : 503
  })
}
