import path from 'path'
import os from 'os'
import fs from 'fs/promises'
import {
  supabaseAdmin,
  BUCKETS as SUPABASE_BUCKETS,
  uploadFile as supabaseUpload,
  downloadFile as supabaseDownload,
  deleteFile as supabaseDelete,
  getPublicUrl,
  getSignedUrl,
  isStorageConfigured,
  type BucketName,
  type UploadResult,
} from './supabase'

export type StorageType = 'temp' | 'user' | 'project' | 'thumbnail' | 'processed' | 'task' | 'bin'

export interface StorageConfig {
  type: StorageType
  baseDir: string
  isCloud: boolean
}

export const USE_SUPABASE_STORAGE = isStorageConfigured()

const DEFAULT_STORAGE_DIR = process.env.STORAGE_DIR || 
  (process.env.VERCEL ? '/tmp/storage' : path.join(os.tmpdir(), 'v0-frame', 'storage'))

const STORAGE_BACKEND = process.env.STORAGE_BACKEND || (USE_SUPABASE_STORAGE ? 'supabase' : 'local')

export const storageConfig: StorageConfig = {
  type: STORAGE_BACKEND as StorageType,
  baseDir: DEFAULT_STORAGE_DIR,
  isCloud: STORAGE_BACKEND === 'supabase' || STORAGE_BACKEND === 's3' || STORAGE_BACKEND === 'r2'
}

export const BUCKETS = SUPABASE_BUCKETS
export type { BucketName, UploadResult }

export const storagePaths = {
  temp: () => path.join(DEFAULT_STORAGE_DIR, 'temp', 'ingest'),
  user: (userId: string) => path.join(DEFAULT_STORAGE_DIR, 'user', userId, 'Gallery', 'images'),
  project: (projectId: string, albumId: string) => path.join(DEFAULT_STORAGE_DIR, 'projects', projectId, 'albums', albumId),
  thumbnail: (imageId: string) => path.join(DEFAULT_STORAGE_DIR, 'thumbnails', imageId),
  processed: (imageId: string) => path.join(DEFAULT_STORAGE_DIR, 'processed', imageId),
  task: (jobId: string, stage: string) => path.join(DEFAULT_STORAGE_DIR, 'tasks', jobId, stage),
  bin: (originalPath: string) => path.join(DEFAULT_STORAGE_DIR, 'bin', originalPath),
  root: () => DEFAULT_STORAGE_DIR
}

export const storageStructure = [
  { path: 'temp/ingest', purpose: 'Temporary uploads (ephemeral)', retention: '24-48 hours' },
  { path: 'user/{userId}/Gallery/images', purpose: 'User gallery images', retention: 'Permanent' },
  { path: 'projects/{projectId}/albums/{albumId}', purpose: 'Project album media', retention: 'Permanent' },
  { path: 'thumbnails/{imageId}', purpose: 'Generated thumbnails (128/256/512px)', retention: 'Permanent' },
  { path: 'processed/{imageId}', purpose: 'Compressed/processed images', retention: 'Permanent' },
  { path: 'tasks/{jobId}', purpose: 'Processing job temp files', retention: 'Job completion' },
  { path: 'bin/{originalPath}', purpose: 'Soft-deleted files (30-day recovery)', retention: '30 days' }
]

export function getStorageInfo() {
  return {
    backend: STORAGE_BACKEND,
    baseDir: DEFAULT_STORAGE_DIR,
    isCloud: storageConfig.isCloud,
    structure: storageStructure,
    platform: process.platform,
    isVercel: !!process.env.VERCEL,
    useSupabase: USE_SUPABASE_STORAGE
  }
}

export interface StoragePathResult {
  bucket: BucketName
  path: string
  fullPath: string
  publicUrl?: string
}

export async function storeFile(
  sourcePath: string,
  destination: {
    bucket: BucketName
    path: string
    contentType?: string
  }
): Promise<StoragePathResult> {
  if (USE_SUPABASE_STORAGE) {
    const fileBuffer = await fs.readFile(sourcePath)
    const result = await supabaseUpload({
      bucket: destination.bucket,
      path: destination.path,
      file: fileBuffer,
      contentType: destination.contentType,
    })

    if (result.error) {
      throw new Error(`Failed to upload to Supabase: ${result.error}`)
    }

    const publicUrl = getPublicUrl(destination.bucket, destination.path)

    return {
      bucket: destination.bucket,
      path: destination.path,
      fullPath: result.fullPath,
      publicUrl: publicUrl || undefined,
    }
  }

  const localPath = path.join(DEFAULT_STORAGE_DIR, destination.bucket, destination.path)
  await fs.mkdir(path.dirname(localPath), { recursive: true })
  await fs.copyFile(sourcePath, localPath)

  return {
    bucket: destination.bucket,
    path: destination.path,
    fullPath: localPath,
  }
}

export async function storeBuffer(
  buffer: Buffer,
  destination: {
    bucket: BucketName
    path: string
    contentType?: string
  }
): Promise<StoragePathResult> {
  if (USE_SUPABASE_STORAGE) {
    const result = await supabaseUpload({
      bucket: destination.bucket,
      path: destination.path,
      file: buffer,
      contentType: destination.contentType,
    })

    if (result.error) {
      throw new Error(`Failed to upload to Supabase: ${result.error}`)
    }

    const publicUrl = getPublicUrl(destination.bucket, destination.path)

    return {
      bucket: destination.bucket,
      path: destination.path,
      fullPath: result.fullPath,
      publicUrl: publicUrl || undefined,
    }
  }

  const localPath = path.join(DEFAULT_STORAGE_DIR, destination.bucket, destination.path)
  await fs.mkdir(path.dirname(localPath), { recursive: true })
  await fs.writeFile(localPath, buffer)

  return {
    bucket: destination.bucket,
    path: destination.path,
    fullPath: localPath,
  }
}

export async function retrieveFile(
  storage: {
    bucket: BucketName
    path: string
    fullPath?: string
  }
): Promise<string> {
  if (USE_SUPABASE_STORAGE && storage.path) {
    const result = await supabaseDownload(storage.bucket, storage.path)
    if (result.error || !result.data) {
      throw new Error(`Failed to download from Supabase: ${result.error}`)
    }

    const tempPath = path.join(os.tmpdir(), 'v0-frame-cache', storage.path)
    await fs.mkdir(path.dirname(tempPath), { recursive: true })
    await fs.writeFile(tempPath, Buffer.from(await result.data.arrayBuffer()))
    return tempPath
  }

  const localPath = storage.fullPath || path.join(DEFAULT_STORAGE_DIR, storage.bucket, storage.path)
  return localPath
}

export async function removeFile(
  storage: {
    bucket: BucketName
    path: string
  }
): Promise<boolean> {
  if (USE_SUPABASE_STORAGE) {
    const result = await supabaseDelete(storage.bucket, storage.path)
    return result.success
  }

  try {
    const localPath = path.join(DEFAULT_STORAGE_DIR, storage.bucket, storage.path)
    await fs.unlink(localPath)
    return true
  } catch {
    return false
  }
}

export async function getFileUrl(
  storage: {
    bucket: BucketName
    path: string
  },
  expiresIn?: number
): Promise<string | null> {
  if (USE_SUPABASE_STORAGE) {
    if (expiresIn) {
      const result = await getSignedUrl(storage.bucket, storage.path, expiresIn)
      return result.url
    }
    return getPublicUrl(storage.bucket, storage.path)
  }

  return null
}
