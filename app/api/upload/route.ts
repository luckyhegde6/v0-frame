import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!isSupabaseAvailable()) {
      // Return mock response in demo mode
      return NextResponse.json({ 
        data: { 
          id: Math.random().toString(),
          title: title || file.name, 
          description,
          file_size: file.size,
          file_type: file.type,
          created_at: new Date().toISOString(),
        } 
      })
    }

    const fileName = `${Date.now()}-${file.name}`
    const buffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase!.storage.from('images').upload(fileName, buffer, {
      contentType: file.type,
    })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Create database record
    const { data, error: insertError } = await supabase!
      .from('images')
      .insert([
        {
          title: title || file.name,
          description,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
        },
      ])
      .select()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ data: data?.[0] })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
