import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logJobCancelled } from '@/lib/audit'

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

    if (!['PENDING', 'RUNNING'].includes(job.status)) {
      return NextResponse.json(
        { error: 'Only pending or running jobs can be cancelled' },
        { status: 400 }
      )
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'CANCELLED',
        lockedAt: null,
        lockedBy: null
      }
    })

    await logJobCancelled(jobId, session.user.id, {
      jobType: job.type,
      previousStatus: job.status,
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
    console.error('[Job Cancel API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    )
  }
}
