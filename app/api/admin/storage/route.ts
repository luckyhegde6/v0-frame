import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { isAdmin } from '@/lib/auth/access'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { supabaseAdmin, BUCKETS, isStorageConfigured, listFiles } from '@/lib/storage/supabase'

const STORAGE_DIR = process.env.STORAGE_DIR || 
  (process.env.VERCEL ? '/tmp/storage' : path.join(os.tmpdir(), 'v0-frame', 'storage'))

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
      let cursor: string | undefined

      do {
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .list('', {
            limit: 1000,
            cursor,
            sortBy: { column: 'created_at', order: 'desc' }
          })

        if (error) {
          console.error(`Error listing bucket ${bucket}:`, error)
          break
        }

        if (!data || data.length === 0) break

        for (const item of data) {
          if (item.metadata?.size) {
            totalSize += item.metadata.size
          }
          fileCount++
        }

        cursor = data.length === 1000 ? data[data.length - 1].id : undefined
      } while (cursor)

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

    const [
      imageCount,
      userCount,
      projectCount,
      albumCount,
      totalImageSize,
      processingCount,
      storedCount
    ] = await Promise.all([
      prisma.image.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.album.count(),
      prisma.image.aggregate({
        _sum: { sizeBytes: true }
      }),
      prisma.image.count({ where: { status: 'PROCESSING' } }),
      prisma.image.count({ where: { status: 'STORED' } })
    ])

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
    const topUsers = storageByUser.map(s => ({
      user: userStorageMap.get(s.userId) || { id: s.userId, name: 'Unknown', email: 'Unknown' },
      sizeBytes: s._sum.sizeBytes || 0,
      imageCount: s._count.id
    }))

    const storageByType = await prisma.image.groupBy({
      by: ['storageType'],
      _sum: { sizeBytes: true },
      _count: { id: true }
    })

    const statusByType = await prisma.image.groupBy({
      by: ['status'],
      _count: { id: true }
    })

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
      byType: storageByType.map(t => ({
        type: t.storageType,
        sizeBytes: t._sum.sizeBytes || 0,
        sizeFormatted: formatBytes(t._sum.sizeBytes || 0),
        count: t._count.id
      })),
      byStatus: statusByType.map(s => ({
        status: s.status,
        count: s._count.id
      })),
      storageDir: useSupabase ? 'Supabase Storage' : STORAGE_DIR,
      storageBackend: useSupabase ? 'supabase' : 'local',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[StorageAPI] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get storage stats' },
      { status: 500 }
    )
  }
}
