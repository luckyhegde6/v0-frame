// Phase 2: Admin Job Details API (Read-Only)
// See: .ai/contracts/phase-2-processing.md § Admin Job Inspection

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/jobs/:id
 * Fetch details for a specific job
 * Read-only endpoint for admin inspection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        image: {
          select: {
            id: true,
            checksum: true,
            status: true,
            title: true,
            width: true,
            height: true,
            sizeBytes: true,
            mimeType: true,
            tempPath: true,
            thumbnailPath: true,
            previewPath: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Transform response
    const response = {
      ...job,
      payload: JSON.parse(job.payload),
      locked: job.lockedAt ? {
        at: job.lockedAt,
        by: job.lockedBy
      } : null,
      retryInfo: {
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        canRetry: job.status === 'FAILED' && job.attempts < job.maxAttempts
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Admin Job Details API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}
