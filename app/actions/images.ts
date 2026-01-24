'use server'

import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function fetchImages() {
  try {
    if (!isSupabaseAvailable()) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase!
      .from('images')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching images:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch images' }
  }
}

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!file) throw new Error('No file provided')

    if (!isSupabaseAvailable()) {
      // Return mock response in demo mode
      return { 
        data: { 
          id: Math.random().toString(),
          title: title || file.name,
          description,
          file_size: file.size,
          file_type: file.type,
          created_at: new Date().toISOString(),
        }, 
        error: null 
      }
    }

    const fileName = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase!.storage
      .from('images')
      .upload(fileName, file)

    if (uploadError) throw uploadError

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

    if (insertError) throw insertError

    revalidatePath('/gallery')
    revalidatePath('/upload')

    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to upload image' }
  }
}

export async function deleteImage(id: string, filePath: string) {
  try {
    if (!isSupabaseAvailable()) {
      return { error: null }
    }

    const { error: deleteStorageError } = await supabase!.storage
      .from('images')
      .remove([filePath])

    if (deleteStorageError) throw deleteStorageError

    const { error: deleteDbError } = await supabase!
      .from('images')
      .delete()
      .eq('id', id)

    if (deleteDbError) throw deleteDbError

    revalidatePath('/gallery')
    return { error: null }
  } catch (error) {
    console.error('Error deleting image:', error)
    return { error: error instanceof Error ? error.message : 'Failed to delete image' }
  }
}

export async function updateImage(id: string, updates: { title?: string; description?: string }) {
  try {
    if (!isSupabaseAvailable()) {
      return { data: null, error: null }
    }

    const { data, error } = await supabase!
      .from('images')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error

    revalidatePath('/gallery')
    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('Error updating image:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update image' }
  }
}
