'use server'

import { revalidatePath } from 'next/cache'

/**
 * Phase 2: Server Actions for Image Management
 * Communicates with backend API endpoints
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000'

export async function fetchImages() {
  try {
    const response = await fetch(`${API_BASE}/api/images`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json()
    return { data: result.data || [], error: null }
  } catch (error) {
    console.error('[fetchImages] Error:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Failed to fetch images' 
    }
  }
}

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const collection = formData.get('collection') as string

    if (!file) {
      throw new Error('No file provided')
    }

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    if (title) uploadFormData.append('title', title)
    if (collection) uploadFormData.append('collection', collection)

    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: uploadFormData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    const data = await response.json()
    revalidatePath('/images')
    
    return { 
      data: {
        id: data.imageId,
        status: data.status,
        checksum: data.checksum,
        sizeBytes: data.sizeBytes,
        uploadedAt: data.uploadedAt,
        title: title || file.name
      },
      error: null 
    }
  } catch (error) {
    console.error('[uploadImage] Error:', error)
    return { 
      data: null,
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

export async function deleteImage(id: string, filePath: string) {
  // Phase 2: Not yet implemented in Phase 2 contract
  return { error: 'Delete not yet implemented' }
}

export async function updateImage(id: string, updates: { title?: string; description?: string }) {
  // Phase 2: Update image metadata
  try {
    // TODO: Implement in Phase 3+
    return { data: null, error: null }
  } catch (error) {
    return { data: null, error: 'Update not yet implemented' }
  }
}
