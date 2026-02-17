'use client'

import { useEffect, useState } from 'react'
import { Activity, ArrowLeft, RefreshCw, Loader2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { handleApiError } from '@/lib/error-handler'

interface JobData {
  id: string
  type: string
  status: string
  attempts: number
  maxAttempts: number
  lastError: string | null
  createdAt: string
  updatedAt: string
  locked: { at: string; by: string } | null
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({ pending: 0, running: 0, completed: 0, failed: 0 })
  const [filter, setFilter] = useState<string>('all')

  const fetchJobs = async () => {
    try {
      const statusParam = filter !== 'all' ? `&status=${filter}` : ''
      const response = await fetch(`/api/admin/jobs?limit=50${statusParam}`)
      if (!response.ok) throw new Error('Failed to fetch jobs')
      const data = await response.json()
      setJobs(data.jobs || [])
      
      const allJobsResponse = await fetch('/api/admin/jobs?limit=1000')
      const allJobsData = await allJobsResponse.json()
      
      const allJobs = allJobsData.jobs || []
      setStats({
        pending: allJobs.filter((j: JobData) => j.status === 'PENDING').length,
        running: allJobs.filter((j: JobData) => j.status === 'RUNNING').length,
        completed: allJobs.filter((j: JobData) => j.status === 'COMPLETED').length,
        failed: allJobs.filter((j: JobData) => j.status === 'FAILED').length,
      })
    } catch (error) {
      handleApiError(error, 'FetchJobs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [filter])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchJobs()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'RUNNING':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'RUNNING':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'FAILED':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
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
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Jobs Monitor</h1>
              <p className="text-muted-foreground">Background job processing status</p>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Running</p>
            <p className="text-2xl font-bold text-blue-500">{stats.running}</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {['all', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Attempts</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Error</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(job.status)}`}>
                        {getStatusIcon(job.status)}
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {job.type}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {job.attempts}/{job.maxAttempts}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-500 max-w-xs truncate">
                      {job.lastError || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No jobs found
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
