import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getStorageInfo, storagePaths, storageStructure } from '@/lib/storage'

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
  const services: Record<string, { status: string; responseTime?: number; details?: string | object }> = {}
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

  // Check storage
  try {
    const fsPromises = await import('fs/promises')
    const storageInfo = getStorageInfo()
    const rootPath = storageInfo.baseDir

    const pathStatus: Record<string, { exists: boolean; writable?: boolean }> = {}
    let allPathsAccessible = true

    for (const struct of storageStructure) {
      const fullPath = rootPath + (struct.path.includes('{') ? '' : '/' + struct.path.split('/').slice(0, 2).join('/'))
      try {
        await fsPromises.access(fullPath)
        pathStatus[struct.path] = { exists: true, writable: true }
      } catch {
        pathStatus[struct.path] = { exists: false }
        allPathsAccessible = false
      }
    }

    services.storage = {
      status: allPathsAccessible ? 'healthy' : 'degraded',
      details: {
        backend: storageInfo.backend,
        baseDir: storageInfo.baseDir,
        platform: storageInfo.platform,
        isVercel: storageInfo.isVercel,
        structure: storageInfo.structure,
        pathStatus
      }
    }

    if (!allPathsAccessible) {
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
