// Phase 2: Admin Job Inspection API (Read-Only)
// See: .ai/contracts/phase-2-processing.md § Admin Job Inspection

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/jobs
 * List all jobs with optional filtering
 * Read-only endpoint for admin inspection
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const imageId = searchParams.get('imageId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (imageId) where.imageId = imageId;

    // Fetch jobs
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          image: {
            select: {
              id: true,
              checksum: true,
              status: true,
              title: true
            }
          }
        }
      }),
      prisma.job.count({ where })
    ]);

    // Transform response
    const jobsWithParsedPayload = jobs.map(job => ({
      ...job,
      payload: JSON.parse(job.payload),
      locked: job.lockedAt ? {
        at: job.lockedAt,
        by: job.lockedBy
      } : null
    }));

    return NextResponse.json({
      jobs: jobsWithParsedPayload,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('[Admin Jobs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
