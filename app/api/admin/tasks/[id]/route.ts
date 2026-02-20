import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: taskId } = await params

    const task = await prisma.adminTask.findUnique({
      where: { id: taskId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('[AdminTaskAPI] Failed to fetch task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: taskId } = await params
    const body = await request.json()
    const { action, assignedToId } = body

    const task = await prisma.adminTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'assign':
        if (assignedToId) {
          const assignedUser = await prisma.user.findUnique({
            where: { id: assignedToId }
          })
          if (!assignedUser || !['ADMIN', 'SUPERADMIN'].includes(assignedUser.role)) {
            return NextResponse.json(
              { error: 'Can only assign to ADMIN or SUPERADMIN' },
              { status: 400 }
            )
          }
        }
        updateData = {
          createdById: assignedToId || session.user.id,
          status: 'QUEUED'
        }
        break

      case 'start':
        if (task.status !== 'PENDING' && task.status !== 'QUEUED') {
          return NextResponse.json(
            { error: 'Can only start pending or queued tasks' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'RUNNING',
          startedAt: new Date()
        }
        break

      case 'complete':
        if (task.status === 'COMPLETED') {
          return NextResponse.json(
            { error: 'Task is already completed' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'COMPLETED',
          completedAt: new Date(),
          progress: 100
        }
        break

      case 'fail':
        updateData = {
          status: 'FAILED',
          error: body.error || 'Marked as failed by admin'
        }
        break

      case 'reset':
        if (task.status === 'RUNNING') {
          return NextResponse.json(
            { error: 'Cannot reset a running task' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'PENDING',
          startedAt: null,
          completedAt: null,
          error: null,
          progress: 0
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updatedTask = await prisma.adminTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error('[AdminTaskAPI] Failed to update task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: taskId } = await params

    const task = await prisma.adminTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.status === 'RUNNING') {
      return NextResponse.json(
        { error: 'Cannot delete a running task' },
        { status: 400 }
      )
    }

    await prisma.adminTask.delete({
      where: { id: taskId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AdminTaskAPI] Failed to delete task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
