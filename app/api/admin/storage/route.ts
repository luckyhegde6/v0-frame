import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { isAdmin } from '@/lib/auth/access'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { supabaseAdmin, BUCKETS, isStorageConfigured } from '@/lib/storage/supabase'
import { getStorageInfo } from '@/lib/storage'

function getStorageDir(): string {
  return getStorageInfo().baseDir
}

const STORAGE_DIR = getStorageDir()

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function deleteFromSupabase(bucket: string, filePath: string): Promise<boolean> {
  if (!supabaseAdmin) return false
  
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath])
    
    if (error) {
      console.error(`[StorageCleanup] Error deleting ${filePath} from ${bucket}:`, error)
      return false
    }
    return true
  } catch (error) {
    console.error(`[StorageCleanup] Exception deleting ${filePath}:`, error)
    return false
  }
}

async function deleteImageStorage(image: {
  id: string
  userId: string
  tempPath: string | null
  thumbnailPath: string | null
  previewPath: string | null
  storageType: string
}): Promise<{ deletedFiles: number; freedBytes: number }> {
  let deletedFiles = 0
  let freedBytes = 0

  if (isStorageConfigured() && supabaseAdmin) {
    const paths = [
      { path: image.tempPath, bucket: image.storageType === 'GALLERY' ? BUCKETS.USER_GALLERY : BUCKETS.PROJECT_ALBUMS },
      { path: image.thumbnailPath, bucket: BUCKETS.THUMBNAILS },
      { path: image.previewPath, bucket: BUCKETS.PROCESSED },
    ]

    for (const { path: filePath, bucket } of paths) {
      if (filePath) {
        const success = await deleteFromSupabase(bucket, filePath)
        if (success) deletedFiles++
      }
    }
  } else {
    const storageInfo = getStorageInfo()
    const storageBase = storageInfo.baseDir

    const paths = [
      image.tempPath,
      image.thumbnailPath,
      image.previewPath,
    ]

    for (const filePath of paths) {
      if (filePath) {
        const fullPath = path.join(storageBase, filePath)
        if (fs.existsSync(fullPath)) {
          try {
            const stat = fs.statSync(fullPath)
            freedBytes += stat.size
            fs.unlinkSync(fullPath)
            deletedFiles++
          } catch (err) {
            console.error(`[StorageCleanup] Error deleting local file ${fullPath}:`, err)
          }
        }
      }
    }
  }

  return { deletedFiles, freedBytes }
}

interface DirectoryStats {
  name: string
  path: string
  size: number
  fileCount: number
  lastModified: string | null
}

interface BucketStats {
  name: string
  size: number
  fileCount: number
}

function getDirectoryStats(dirPath: string): DirectoryStats {
  const stats: DirectoryStats = {
    name: path.basename(dirPath),
    path: dirPath.replace(STORAGE_DIR, ''),
    size: 0,
    fileCount: 0,
    lastModified: null
  }

  try {
    if (!fs.existsSync(dirPath)) {
      return stats
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    let latestModified: Date | null = null

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      
      if (entry.isDirectory()) {
        const subStats = getDirectoryStats(fullPath)
        stats.size += subStats.size
        stats.fileCount += subStats.fileCount
        if (subStats.lastModified) {
          const subDate = new Date(subStats.lastModified)
          if (!latestModified || subDate > latestModified) {
            latestModified = subDate
          }
        }
      } else if (entry.isFile()) {
        try {
          const fileStat = fs.statSync(fullPath)
          stats.size += fileStat.size
          stats.fileCount++
          if (!latestModified || fileStat.mtime > latestModified) {
            latestModified = fileStat.mtime
          }
        } catch {}
      }
    }

    stats.lastModified = latestModified ? latestModified.toISOString() : null
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
  }

  return stats
}

async function getSupabaseBucketStats(): Promise<BucketStats[]> {
  if (!supabaseAdmin) {
    return []
  }

  const buckets = [
    { name: 'temp', bucket: BUCKETS.TEMP },
    { name: 'user', bucket: BUCKETS.USER_GALLERY },
    { name: 'projects', bucket: BUCKETS.PROJECT_ALBUMS },
    { name: 'thumbnails', bucket: BUCKETS.THUMBNAILS },
    { name: 'processed', bucket: BUCKETS.PROCESSED },
  ]

  const results: BucketStats[] = []

  for (const { name, bucket } of buckets) {
    try {
      let totalSize = 0
      let fileCount = 0

      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error(`Error listing bucket ${bucket}:`, error)
        results.push({ name, size: 0, fileCount: 0 })
        continue
      }

      if (data) {
        for (const item of data) {
          if (item.metadata?.size) {
            totalSize += item.metadata.size
          }
          fileCount++
        }
      }

      results.push({ name, size: totalSize, fileCount })
    } catch (error) {
      console.error(`Error getting stats for bucket ${bucket}:`, error)
      results.push({ name, size: 0, fileCount: 0 })
    }
  }

  return results
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const useSupabase = isStorageConfigured()
    let directories: DirectoryStats[] = []

    if (useSupabase) {
      const bucketStats = await getSupabaseBucketStats()
      directories = bucketStats.map(bs => ({
        name: bs.name,
        path: `/${bs.name}`,
        size: bs.size,
        fileCount: bs.fileCount,
        lastModified: null
      }))
      directories.push({ name: 'tasks', path: '/tasks', size: 0, fileCount: 0, lastModified: null })
      directories.push({ name: 'bin', path: '/bin', size: 0, fileCount: 0, lastModified: null })
    } else {
      const storageTypes = ['temp', 'user', 'projects', 'thumbnails', 'processed', 'tasks', 'bin']
      for (const type of storageTypes) {
        const typePath = path.join(STORAGE_DIR, type)
        const stats = getDirectoryStats(typePath)
        stats.name = type
        stats.path = `/${type}`
        directories.push(stats)
      }
    }

    const totalSize = directories.reduce((sum, d) => sum + d.size, 0)
    const totalFiles = directories.reduce((sum, d) => sum + d.fileCount, 0)

    const imageCount = await prisma.image.count()
    const userCount = await prisma.user.count()
    const projectCount = await prisma.project.count()
    const albumCount = await prisma.album.count()
    
    const totalImageSize = await prisma.image.aggregate({
      _sum: { sizeBytes: true }
    })
    
    const processingCount = await prisma.image.count({ 
      where: { status: 'PROCESSING' } 
    }).catch(() => 0)
    
    const storedCount = await prisma.image.count({ 
      where: { status: 'STORED' } 
    }).catch(() => 0)

    let topUsers: Array<{
      user: { id: string; name: string | null; email: string | null }
      sizeBytes: number
      imageCount: number
    }> = []

    try {
      const storageByUser = await prisma.image.groupBy({
        by: ['userId'],
        _sum: { sizeBytes: true },
        _count: { id: true },
        orderBy: { _sum: { sizeBytes: 'desc' } },
        take: 10
      })

      const userIds = storageByUser.map(s => s.userId)
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
      })

      const userStorageMap = new Map(users.map(u => [u.id, u]))
      topUsers = storageByUser.map(s => ({
        user: userStorageMap.get(s.userId) || { id: s.userId, name: 'Unknown', email: 'Unknown' },
        sizeBytes: s._sum.sizeBytes || 0,
        imageCount: s._count.id
      }))
    } catch (error) {
      console.error('[StorageAPI] Error getting user storage:', error)
    }

    let byType: Array<{ type: string; sizeBytes: number; sizeFormatted: string; count: number }> = []
    
    try {
      const storageByType = await prisma.image.groupBy({
        by: ['storageType'],
        _sum: { sizeBytes: true },
        _count: { id: true }
      })
      
      byType = storageByType.map(t => ({
        type: t.storageType,
        sizeBytes: t._sum.sizeBytes || 0,
        sizeFormatted: formatBytes(t._sum.sizeBytes || 0),
        count: t._count.id
      }))
    } catch (error) {
      console.error('[StorageAPI] Error getting storage by type:', error)
    }

    let byStatus: Array<{ status: string; count: number }> = []
    
    try {
      const statusByType = await prisma.image.groupBy({
        by: ['status'],
        _count: { id: true }
      })
      
      byStatus = statusByType.map(s => ({
        status: s.status,
        count: s._count.id
      }))
    } catch (error) {
      console.error('[StorageAPI] Error getting status counts:', error)
    }

    return NextResponse.json({
      storage: {
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        totalFiles,
        directories: directories.map(d => ({
          ...d,
          sizeFormatted: formatBytes(d.size)
        }))
      },
      database: {
        imageCount,
        userCount,
        projectCount,
        albumCount,
        totalImageSize: totalImageSize._sum.sizeBytes || 0,
        totalImageSizeFormatted: formatBytes(totalImageSize._sum.sizeBytes || 0),
        processingCount,
        storedCount
      },
      byUser: topUsers.map(u => ({
        ...u,
        sizeFormatted: formatBytes(u.sizeBytes)
      })),
      byType,
      byStatus,
      storageDir: useSupabase ? 'Supabase Storage' : STORAGE_DIR,
      storageBackend: useSupabase ? 'supabase' : 'local',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[StorageAPI] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get storage stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')
    const imageIds = searchParams.get('imageIds')
    const action = searchParams.get('action') || 'soft-delete'

    const hardDelete = action === 'hard-delete'

    if (!userId && !projectId && !imageIds) {
      return NextResponse.json(
        { error: 'Must specify userId, projectId, or imageIds' },
        { status: 400 }
      )
    }

    let imagesToDelete: Array<{
      id: string
      userId: string
      tempPath: string | null
      thumbnailPath: string | null
      previewPath: string | null
      storageType: string
      sizeBytes: number | null
    }> = []

    if (imageIds) {
      const ids = imageIds.split(',')
      imagesToDelete = await prisma.image.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          userId: true,
          tempPath: true,
          thumbnailPath: true,
          previewPath: true,
          storageType: true,
          sizeBytes: true
        }
      })
    } else if (userId) {
      imagesToDelete = await prisma.image.findMany({
        where: { userId },
        select: {
          id: true,
          userId: true,
          tempPath: true,
          thumbnailPath: true,
          previewPath: true,
          storageType: true,
          sizeBytes: true
        }
      })
    } else if (projectId) {
      const albumIds = await prisma.album.findMany({
        where: { projectId },
        select: { id: true }
      }).then(albums => albums.map(a => a.id))

      imagesToDelete = await prisma.image.findMany({
        where: { albumId: { in: albumIds } },
        select: {
          id: true,
          userId: true,
          tempPath: true,
          thumbnailPath: true,
          previewPath: true,
          storageType: true,
          sizeBytes: true
        }
      })
    }

    if (imagesToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No images found to delete',
        deleted: 0,
        freedBytes: 0
      })
    }

    let deletedFromDb = 0
    let deletedFiles = 0
    let freedBytes = 0

    for (const image of imagesToDelete) {
      const result = await deleteImageStorage(image)
      deletedFiles += result.deletedFiles
      freedBytes += result.freedBytes

      if (hardDelete) {
        await prisma.image.delete({ where: { id: image.id } })
        deletedFromDb++
      } else {
        await prisma.image.update({
          where: { id: image.id },
          data: { 
            deletedAt: new Date(),
            deletedFrom: 'ADMIN_STORAGE_CLEANUP'
          }
        })
        deletedFromDb++
      }
    }

    return NextResponse.json({
      success: true,
      message: hardDelete 
        ? `Permanently deleted ${deletedFromDb} images and ${deletedFiles} storage files`
        : `Soft-deleted ${deletedFromDb} images and removed ${deletedFiles} storage files`,
      deleted: deletedFromDb,
      deletedFiles,
      freedBytes,
      freedBytesFormatted: formatBytes(freedBytes)
    })
  } catch (error) {
    console.error('[StorageCleanup] Error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup storage', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
