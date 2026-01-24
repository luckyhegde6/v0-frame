import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!isSupabaseAvailable()) {
      // Return empty data in demo mode
      return NextResponse.json({
        data: [],
        count: 0,
      })
    }

    const { data, error, count } = await supabase!
      .from('images')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get signed URLs for images
    const imagesWithUrls = await Promise.all(
      (data || []).map(async (image) => {
        const { data: signedData } = await supabase!.storage
          .from('images')
          .createSignedUrl(image.file_path, 3600)

        return {
          ...image,
          signed_url: signedData?.signedUrl,
        }
      })
    )

    return NextResponse.json({
      data: imagesWithUrls,
      count,
    })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch images' },
      { status: 500 }
    )
  }
}
