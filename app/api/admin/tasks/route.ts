import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

/**
 * @swagger
 * /api/admin/tasks:
 *   get:
 *     summary: Get admin tasks (Admin only)
 *     description: Returns a list of all admin tasks with filtering options
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of tasks
 *       403:
 *         description: Forbidden
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.type = type

    const tasks = await prisma.adminTask.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    const stats = await prisma.adminTask.groupBy({
      by: ['status'],
      _count: true
    })

    return NextResponse.json({ tasks, stats })
  } catch (error) {
    console.error('[AdminTasksAPI] Failed to fetch tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/admin/tasks:
 *   post:
 *     summary: Create admin task (Admin only)
 *     description: Creates a new admin task for background processing
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [COMPRESS_IMAGES, EXTRACT_ARCHIVE, OFFLINE_UPLOAD, SYNC_STORAGE, GENERATE_THUMBNAILS, REGENERATE_METADATA, BACKUP_DATABASE, CLEANUP_TEMP, OPTIMIZE_STORAGE, SYNC_USERS]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 default: MEDIUM
 *               payload:
 *                 type: object
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Forbidden
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { type, title, description, priority, payload, scheduledAt } = body

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Type and title are required' },
        { status: 400 }
      )
    }

    const task = await prisma.adminTask.create({
      data: {
        type,
        title,
        description,
        priority: priority || 'MEDIUM',
        payload: payload || {},
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'PENDING' : 'QUEUED',
        createdById: session.user.id
      }
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('[AdminTasksAPI] Failed to create task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/admin/tasks:
 *   delete:
 *     summary: Cancel task (Admin only)
 *     description: Cancels a pending or queued task
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task cancelled
 *       400:
 *         description: Cannot cancel running/completed task
 *       403:
 *         description: Forbidden
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }

    const task = await prisma.adminTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (!['PENDING', 'QUEUED'].includes(task.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel running or completed task' },
        { status: 400 }
      )
    }

    await prisma.adminTask.update({
      where: { id: taskId },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AdminTasksAPI] Failed to cancel task:', error)
    return NextResponse.json(
      { error: 'Failed to cancel task' },
      { status: 500 }
    )
  }
}
