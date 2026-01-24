'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// Mock implementation - all Supabase calls disabled
function isSupabaseAvailable() {
  return false
}

export async function fetchImages() {
  return { data: [], error: null }
}

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const description = formData.get('description') as string

  return { 
    data: { 
      id: Math.random().toString(),
      title: title || file?.name || 'Image',
      description,
      created_at: new Date().toISOString(),
    }, 
    error: null 
  }
}

export async function deleteImage(id: string, filePath: string) {
  return { error: null }
}

export async function updateImage(id: string, updates: { title?: string; description?: string }) {
  return { data: null, error: null }
}
