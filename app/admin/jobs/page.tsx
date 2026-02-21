'use client'

import { useEffect, useState, Fragment } from 'react'
import { Activity, ArrowLeft, RefreshCw, Loader2, Clock, CheckCircle, XCircle, AlertCircle, Play, Ban, RotateCcw, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { handleApiError, showSuccess } from '@/lib/error-handler'

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
  image?: {
    id: string
    title?: string
    status: string
  }
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({ pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 })
  const [filter, setFilter] = useState<string>('all')
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
        cancelled: allJobs.filter((j: JobData) => j.status === 'CANCELLED').length,
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

  const handleRetry = async (jobId: string) => {
    if (!confirm('Are you sure you want to retry this job?')) return
    setActionLoading(jobId)
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/retry`, { method: 'POST' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to retry job')
      }
      showSuccess('Job retry initiated')
      fetchJobs()
    } catch (error) {
      handleApiError(error, 'RetryJob')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this job?')) return
    setActionLoading(jobId)
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/cancel`, { method: 'POST' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel job')
      }
      showSuccess('Job cancelled')
      fetchJobs()
    } catch (error) {
      handleApiError(error, 'CancelJob')
    } finally {
      setActionLoading(null)
    }
  }

  const handleForceRun = async (jobId: string) => {
    if (!confirm('Force run this job? It will be marked as RUNNING immediately.')) return
    setActionLoading(jobId)
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/run`, { method: 'POST' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to force run job')
      }
      showSuccess('Job marked as RUNNING')
      fetchJobs()
    } catch (error) {
      handleApiError(error, 'ForceRunJob')
    } finally {
      setActionLoading(null)
    }
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
      case 'CANCELLED':
        return <Ban className="w-4 h-4 text-gray-500" />
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
      case 'CANCELLED':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const toggleExpand = (jobId: string) => {
    setExpandedJob(expandedJob === jobId ? null : jobId)
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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
          <div className="p-4 bg-card border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold text-gray-500">{stats.cancelled}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'].map((status) => (
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-8"></th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Attempts</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Error</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job) => (
                  <Fragment key={job.id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleExpand(job.id)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          {expandedJob === job.id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </td>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {job.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetry(job.id)}
                              disabled={actionLoading === job.id}
                              className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                              title="Retry job"
                            >
                              {actionLoading === job.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {job.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleForceRun(job.id)}
                                disabled={actionLoading === job.id}
                                className="p-1.5 bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                title="Force run"
                              >
                                {actionLoading === job.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleCancel(job.id)}
                                disabled={actionLoading === job.id}
                                className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                title="Cancel job"
                              >
                                {actionLoading === job.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Ban className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          )}
                          {job.status === 'RUNNING' && (
                            <button
                              onClick={() => handleCancel(job.id)}
                              disabled={actionLoading === job.id}
                              className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
                              title="Cancel job"
                            >
                              {actionLoading === job.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Ban className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedJob === job.id && (
                      <tr key={`${job.id}-details`} className="bg-muted/20">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1">Job ID</p>
                              <p className="font-mono text-xs break-all">{job.id}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Locked</p>
                              <p>{job.locked ? `By ${job.locked.by}` : 'No'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Updated</p>
                              <p>{new Date(job.updatedAt).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Image</p>
                              {job.image ? (
                                <Link 
                                  href={`/admin/gallery?highlight=${job.image.id}`}
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  {job.image.title || job.image.id.slice(0, 8)}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">None</span>
                              )}
                            </div>
                            {job.lastError && (
                              <div className="col-span-2 md:col-span-4">
                                <p className="text-muted-foreground mb-1">Error Details</p>
                                <pre className="p-3 bg-red-500/5 border border-red-500/20 rounded text-xs text-red-400 overflow-x-auto whitespace-pre-wrap">
                                  {job.lastError}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
