import { NextRequest, NextResponse } from 'next/server'
import { processPendingJobs } from '@/lib/jobs/processor'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const urlSecret = request.nextUrl.searchParams.get('secret')
    
    const providedSecret = authHeader?.replace('Bearer ', '') || urlSecret
    
    if (CRON_SECRET && providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Cron] Starting job processing...')
    
    const result = await processPendingJobs(5)
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Cron] Job processing error:', error)
    return NextResponse.json(
      { 
        error: 'Job processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
