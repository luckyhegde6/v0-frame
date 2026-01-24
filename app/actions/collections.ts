'use server'

import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function fetchCollections() {
  try {
    if (!isSupabaseAvailable()) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase!
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching collections:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch collections' }
  }
}

export async function createCollection(name: string, description?: string) {
  try {
    if (!isSupabaseAvailable()) {
      return { data: { id: Math.random().toString(), name, description, created_at: new Date().toISOString() }, error: null }
    }

    const { data, error } = await supabase!
      .from('collections')
      .insert([{ name, description }])
      .select()

    if (error) throw error

    revalidatePath('/gallery')
    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('Error creating collection:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create collection' }
  }
}

export async function deleteCollection(id: string) {
  try {
    if (!isSupabaseAvailable()) {
      return { error: null }
    }

    const { error } = await supabase!
      .from('collections')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/gallery')
    return { error: null }
  } catch (error) {
    console.error('Error deleting collection:', error)
    return { error: error instanceof Error ? error.message : 'Failed to delete collection' }
  }
}
