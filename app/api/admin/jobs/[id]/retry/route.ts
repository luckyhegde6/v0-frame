import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logJobRetry } from '@/lib/audit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { id: jobId } = await params

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        image: {
          select: { id: true, status: true }
        }
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'FAILED') {
      return NextResponse.json(
        { error: 'Only failed jobs can be retried' },
        { status: 400 }
      )
    }

    if (job.attempts >= job.maxAttempts) {
      return NextResponse.json(
        { error: 'Job has reached maximum retry attempts' },
        { status: 400 }
      )
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'PENDING',
        lastError: null,
        lockedAt: null,
        lockedBy: null,
        attempts: job.attempts + 1
      }
    })

    await logJobRetry(jobId, session.user.id, job.attempts + 1, {
      jobType: job.type,
      previousError: job.lastError,
      imageId: job.imageId
    })

    return NextResponse.json({
      success: true,
      job: {
        ...updatedJob,
        payload: JSON.parse(updatedJob.payload)
      }
    })

  } catch (error) {
    console.error('[Job Retry API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to retry job' },
      { status: 500 }
    )
  }
}
