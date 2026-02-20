'use client'

import { useEffect, useState } from 'react'
import { Settings, ArrowLeft, RefreshCw, Loader2, HardDrive, Database, Image, Activity, Clock, Zap } from 'lucide-react'
import Link from 'next/link'
import { handleApiError } from '@/lib/error-handler'

interface SystemStats {
  database: {
    totalUsers: number
    totalImages: number
    totalJobs: number
    totalCollections: number
    totalProjects: number
  }
  jobs: {
    pending: number
    running: number
    completed: number
    failed: number
  }
  storage: {
    totalSize: number
    tempSize: number
  }
  uptime: string
}

export default function AdminSystemPage() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      handleApiError(error, 'FetchStats')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStats()
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">System Health</h1>
              <p className="text-muted-foreground">Database and storage metrics</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <p className="text-2xl font-bold">{stats.database.totalUsers}</p>
              </div>
              
              <div className="p-4 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Image className="w-4 h-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Total Images</p>
                </div>
                <p className="text-2xl font-bold">{stats.database.totalImages}</p>
              </div>
              
              <div className="p-4 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                </div>
                <p className="text-2xl font-bold">{stats.database.totalJobs}</p>
              </div>
              
              <div className="p-4 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                </div>
                <p className="text-2xl font-bold">{formatBytes(stats.storage.totalSize)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-6 bg-card border border-border rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Job Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-medium text-yellow-500">{stats.jobs.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Running</span>
                    <span className="font-medium text-blue-500">{stats.jobs.running}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium text-green-500">{stats.jobs.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Failed</span>
                    <span className="font-medium text-red-500">{stats.jobs.failed}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-card border border-border rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Database
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Collections</span>
                    <span className="font-medium">{stats.database.totalCollections}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Projects</span>
                    <span className="font-medium">{stats.database.totalProjects}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Temp Storage</span>
                    <span className="font-medium">{formatBytes(stats.storage.tempSize)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                System Info
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Framework</p>
                  <p className="font-medium">Next.js 16.1.5</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Database</p>
                  <p className="font-medium">PostgreSQL + Prisma</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Runtime</p>
                  <p className="font-medium">Node.js</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Environment</p>
                  <p className="font-medium">{process.env.NODE_ENV || 'development'}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Failed to load system stats
          </div>
        )}
      </main>
    </div>
  )
}
