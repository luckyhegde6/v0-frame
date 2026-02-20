import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Supabase client for storage operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Admin client with service role key (for server-side operations)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl!, supabaseServiceKey)
  : null

// Public client with anon key (for client-side operations)
export const supabaseClient = supabaseAnonKey
  ? createClient(supabaseUrl!, supabaseAnonKey)
  : null

// Bucket names
export const BUCKETS = {
  TEMP: 'temp',
  USER_GALLERY: 'user-gallery',
  PROJECT_ALBUMS: 'project-albums',
  THUMBNAILS: 'thumbnails',
  PROCESSED: 'processed',
} as const

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS]

export interface UploadResult {
  path: string
  fullPath: string
  publicUrl?: string
  error?: string
}

export interface StorageConfig {
  bucket: BucketName
  path: string
  file: File | Buffer | Blob
  contentType?: string
  upsert?: boolean
  cacheControl?: string
}

/**
 * Generate a unique file path for storage
 */
export function generateStoragePath(
  bucket: BucketName,
  params: {
    userId?: string
    projectId?: string
    albumId?: string
    imageId?: string
    filename?: string
    extension?: string
  }
): string {
  const ext = params.extension || 'jpg'
  const uniqueId = params.imageId || crypto.randomUUID()
  
  switch (bucket) {
    case BUCKETS.TEMP:
      return `ingest/${uniqueId}.${ext}`
    
    case BUCKETS.USER_GALLERY:
      if (!params.userId) throw new Error('userId required for user-gallery bucket')
      return `${params.userId}/Gallery/images/${uniqueId}.${ext}`
    
    case BUCKETS.PROJECT_ALBUMS:
      if (!params.projectId || !params.albumId) {
        throw new Error('projectId and albumId required for project-albums bucket')
      }
      return `projects/${params.projectId}/albums/${params.albumId}/${uniqueId}.${ext}`
    
    case BUCKETS.THUMBNAILS:
      if (!params.imageId) throw new Error('imageId required for thumbnails bucket')
      return `${params.imageId}/thumb-${params.filename || '512'}.${ext}`
    
    case BUCKETS.PROCESSED:
      if (!params.imageId) throw new Error('imageId required for processed bucket')
      return `${params.imageId}/${params.filename || 'original'}.${ext}`
    
    default:
      throw new Error(`Unknown bucket: ${bucket}`)
  }
}

/**
 * Upload a file to Supabase Storage (server-side with admin privileges)
 */
export async function uploadFile(config: StorageConfig): Promise<UploadResult> {
  if (!supabaseAdmin) {
    return { path: '', fullPath: '', error: 'Supabase admin client not configured' }
  }

  const { bucket, path, file, contentType, upsert = false, cacheControl = '3600' } = config

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert,
        cacheControl,
      })

    if (error) {
      console.error('[Storage] Upload error:', error)
      return { path: '', fullPath: '', error: error.message }
    }

    // Get public URL if bucket is public
    let publicUrl: string | undefined
    if (bucket === BUCKETS.THUMBNAILS) {
      const { data: urlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(data.path)
      publicUrl = urlData.publicUrl
    }

    return {
      path: data.path,
      fullPath: `${bucket}/${data.path}`,
      publicUrl,
    }
  } catch (error) {
    console.error('[Storage] Upload exception:', error)
    return {
      path: '',
      fullPath: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Download a file from Supabase Storage
 */
export async function downloadFile(
  bucket: BucketName,
  path: string
): Promise<{ data: Blob | null; error: string | null }> {
  if (!supabaseAdmin) {
    return { data: null, error: 'Supabase admin client not configured' }
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .download(path)

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  bucket: BucketName,
  path: string
): Promise<{ success: boolean; error: string | null }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not configured' }
  }

  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Move a file within Supabase Storage
 */
export async function moveFile(
  bucket: BucketName,
  fromPath: string,
  toPath: string
): Promise<{ success: boolean; error: string | null }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not configured' }
  }

  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .move(fromPath, toPath)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Copy a file within Supabase Storage
 */
export async function copyFile(
  bucket: BucketName,
  fromPath: string,
  toPath: string
): Promise<{ success: boolean; error: string | null }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not configured' }
  }

  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .copy(fromPath, toPath)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get a signed URL for temporary access to a private file
 */
export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error: string | null }> {
  if (!supabaseAdmin) {
    return { url: null, error: 'Supabase admin client not configured' }
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      return { url: null, error: error.message }
    }

    return { url: data.signedUrl, error: null }
  } catch (error) {
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get public URL for a file in a public bucket
 */
export function getPublicUrl(bucket: BucketName, path: string): string | null {
  if (!supabaseAdmin) return null

  const { data } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

/**
 * List files in a bucket path
 */
export async function listFiles(
  bucket: BucketName,
  path: string,
  limit: number = 100
): Promise<{ files: Array<{ name: string; id: string }> | null; error: string | null }> {
  if (!supabaseAdmin) {
    return { files: null, error: 'Supabase admin client not configured' }
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(path, {
        limit,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      return { files: null, error: error.message }
    }

    return {
      files: data.map((item) => ({ name: item.name, id: item.id })),
      error: null,
    }
  } catch (error) {
    return {
      files: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if Supabase Storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!(supabaseUrl && (supabaseServiceKey || supabaseAnonKey))
}
