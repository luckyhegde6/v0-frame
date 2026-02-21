import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logJobForceRun } from '@/lib/audit'

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
      where: { id: jobId }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending jobs can be force-run' },
        { status: 400 }
      )
    }

    if (job.lockedAt && job.lockedBy) {
      return NextResponse.json(
        { error: 'Job is currently locked by another process' },
        { status: 400 }
      )
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        lockedAt: new Date(),
        lockedBy: `admin-${session.user.id}`
      }
    })

    await logJobForceRun(jobId, session.user.id, {
      jobType: job.type,
      imageId: job.imageId
    })

    return NextResponse.json({
      success: true,
      job: {
        ...updatedJob,
        payload: JSON.parse(updatedJob.payload)
      },
      message: 'Job marked as RUNNING. It will be picked up by the job runner.'
    })

  } catch (error) {
    console.error('[Job Force Run API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to force run job' },
      { status: 500 }
    )
  }
}
