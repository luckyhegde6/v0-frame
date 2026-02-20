'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  HardDrive, Users, Images, FolderOpen, Database, 
  ArrowLeft, RefreshCw, Server, Clock, AlertCircle,
  FileImage, Cloud, CheckCircle, Loader2
} from 'lucide-react'
import { handleApiError } from '@/lib/error-handler'

interface DirectoryStats {
  name: string
  path: string
  size: number
  sizeFormatted: string
  fileCount: number
  lastModified: string | null
}

interface StorageStats {
  totalSize: number
  totalSizeFormatted: string
  totalFiles: number
  directories: DirectoryStats[]
}

interface UserStorage {
  user: { id: string; name: string | null; email: string | null }
  sizeBytes: number
  sizeFormatted: string
  imageCount: number
}

interface TypeStorage {
  type: string
  sizeBytes: number
  sizeFormatted: string
  count: number
}

interface StatusStorage {
  status: string
  count: number
}

interface StorageData {
  storage: StorageStats
  database: {
    imageCount: number
    userCount: number
    projectCount: number
    albumCount: number
    totalImageSize: number
    totalImageSizeFormatted: string
    processingCount: number
    storedCount: number
  }
  byUser: UserStorage[]
  byType: TypeStorage[]
  byStatus: StatusStorage[]
  storageDir: string
  storageBackend: 'supabase' | 'local'
  timestamp: string
}

export default function StorageMonitorPage() {
  const [data, setData] = useState<StorageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStorage = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/storage')
      if (!response.ok) {
        throw new Error('Failed to fetch storage data')
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      handleApiError(err, 'FetchStorage')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStorage()
  }, [])

  const getStorageIcon = (name: string) => {
    switch (name) {
      case 'temp': return <Clock className="w-5 h-5 text-yellow-500" />
      case 'user': return <Users className="w-5 h-5 text-blue-500" />
      case 'projects': return <FolderOpen className="w-5 h-5 text-purple-500" />
      case 'thumbnails': return <Images className="w-5 h-5 text-green-500" />
      case 'processed': return <FileImage className="w-5 h-5 text-cyan-500" />
      case 'tasks': return <Server className="w-5 h-5 text-orange-500" />
      case 'bin': return <AlertCircle className="w-5 h-5 text-red-500" />
      default: return <HardDrive className="w-5 h-5 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'GALLERY': return <Images className="w-4 h-4 text-blue-400" />
      case 'ALBUM': return <FolderOpen className="w-4 h-4 text-purple-400" />
      default: return <HardDrive className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'STORED': return 'text-green-500'
      case 'PROCESSING': return 'text-yellow-500'
      case 'INGESTED': return 'text-blue-500'
      case 'FAILED': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%'
    return ((value / total) * 100).toFixed(1) + '%'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchStorage}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <HardDrive className="w-7 h-7 text-primary" />
              Storage Monitor
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor storage usage and file distribution
            </p>
          </div>
          <button
            onClick={fetchStorage}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Backend Indicator */}
        <div className={`mb-6 p-4 rounded-xl border ${
          data.storageBackend === 'supabase' 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
          <div className="flex items-center gap-3">
            {data.storageBackend === 'supabase' ? (
              <>
                <Cloud className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-500">Supabase Storage Active</p>
                  <p className="text-sm text-muted-foreground">
                    Files are stored in Supabase cloud storage (Vercel-compatible)
                  </p>
                </div>
              </>
            ) : (
              <>
                <Server className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-yellow-500">Local Storage Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Files are stored on local filesystem - configure Supabase for Vercel deployment
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Storage Used</span>
            </div>
            <p className="text-2xl font-bold">{data.storage.totalSizeFormatted}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.storage.totalFiles.toLocaleString()} files
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">DB Tracked</span>
            </div>
            <p className="text-2xl font-bold">{data.database.totalImageSizeFormatted}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.database.imageCount.toLocaleString()} images in database
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-sm text-muted-foreground">Projects</span>
            </div>
            <p className="text-2xl font-bold">{data.database.projectCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.database.albumCount} albums
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{data.database.storedCount}</p>
              {data.database.processingCount > 0 && (
                <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.database.processingCount} processing
            </p>
          </div>
        </div>

        {/* Storage by Status */}
        {data.byStatus && data.byStatus.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Server className="w-5 h-5" />
              Images by Status
            </h2>
            <div className="flex flex-wrap gap-4">
              {data.byStatus.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg border border-border"
                >
                  <span className={`font-medium ${getStatusColor(s.status)}`}>
                    {s.status}
                  </span>
                  <span className="text-muted-foreground">
                    {s.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Storage Directories & Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              {data.storageBackend === 'supabase' ? 'Supabase Buckets' : 'Storage Directories'}
            </h2>
            <div className="space-y-3">
              {data.storage.directories.map((dir) => (
                <div
                  key={dir.name}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    {getStorageIcon(dir.name)}
                    <div>
                      <p className="font-medium">{dir.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {dir.fileCount.toLocaleString()} files
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{dir.sizeFormatted}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(dir.size, data.storage.totalSize)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Images className="w-5 h-5" />
              Storage by Type
            </h2>
            <div className="space-y-3">
              {data.byType.map((type) => (
                <div
                  key={type.type}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(type.type)}
                    <div>
                      <p className="font-medium">{type.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {type.count.toLocaleString()} images
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{type.sizeFormatted}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(type.sizeBytes, data.database.totalImageSize)}
                    </p>
                  </div>
                </div>
              ))}
              {data.byType.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No images uploaded yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Top Users by Storage */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top Users by Storage
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Images</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Storage</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {data.byUser.map((item, index) => (
                  <tr key={item.user.id} className="border-b border-border/50 hover:bg-accent/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                        <span className="font-medium">{item.user.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {item.user.email || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm">
                      {item.imageCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm">
                      {item.sizeFormatted}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                      {formatPercentage(item.sizeBytes, data.database.totalImageSize)}
                    </td>
                  </tr>
                ))}
                {data.byUser.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No users with uploaded images yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Storage Path Info */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Storage Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-background rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">Storage Backend</p>
              <p className="font-medium capitalize">{data.storageBackend}</p>
            </div>
            <div className="p-4 bg-background rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">Storage Path</p>
              <p className="font-mono text-sm truncate" title={data.storageDir}>
                {data.storageDir}
              </p>
            </div>
            <div className="p-4 bg-background rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {new Date(data.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-background rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">Users</p>
              <p className="font-medium">{data.database.userCount.toLocaleString()} total</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
