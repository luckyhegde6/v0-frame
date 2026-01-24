'use server'

// Mock implementation - all Supabase calls disabled

export async function fetchCollections() {
  return { data: [], error: null }
}

export async function createCollection(name: string, description?: string) {
  return { 
    data: { 
      id: Math.random().toString(), 
      name, 
      description, 
      created_at: new Date().toISOString() 
    }, 
    error: null 
  }
}

export async function deleteCollection(id: string) {
  return { error: null }
}
