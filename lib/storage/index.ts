import path from 'path'
import os from 'os'

export type StorageType = 'temp' | 'user' | 'project' | 'thumbnail' | 'processed' | 'task' | 'bin'

export interface StorageConfig {
  type: StorageType
  baseDir: string
  isCloud: boolean
}

const DEFAULT_STORAGE_DIR = process.env.STORAGE_DIR || (process.env.VERCEL ? '/tmp' : path.join(os.homedir(), 'v0-frame', 'storage'))

const STORAGE_BACKEND = process.env.STORAGE_BACKEND || 'local'

export const storageConfig: StorageConfig = {
  type: STORAGE_BACKEND as StorageType,
  baseDir: DEFAULT_STORAGE_DIR,
  isCloud: STORAGE_BACKEND === 's3' || STORAGE_BACKEND === 'r2'
}

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
    isVercel: !!process.env.VERCEL
  }
}
