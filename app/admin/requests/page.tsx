'use client'

import { useEffect, useState } from 'react'
import { ListChecks, ArrowLeft, RefreshCw, Loader2, Play, CheckCircle, XCircle, RotateCcw, MessageSquare, Clock, User, FolderOpen, Layers, Search } from 'lucide-react'
import Link from 'next/link'
import { handleApiError } from '@/lib/error-handler'

interface RequestData {
  id: string
  type: string
  status: string
  title: string
  description: string | null
  payload: Record<string, unknown> | null
  adminNotes: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    role: string
  }
  project: {
    id: string
    name: string
  } | null
  album: {
    id: string
    name: string
  } | null
}

interface Stats {
  pending: number
  inProgress: number
  completed: number
  failed: number
  total: number
}

interface FilterState {
  status: string
  type: string
  search: string
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestData[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, inProgress: 0, completed: 0, failed: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterState>({ status: '', type: '', search: '' })
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null)
  const [showNotes, setShowNotes] = useState(false)
  const [notesText, setNotesText] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.status) params.set('status', filter.status)
      if (filter.type) params.set('type', filter.type)
      
      const response = await fetch(`/api/admin/requests?${params}`)
      if (!response.ok) throw new Error('Failed to fetch requests')
      const data = await response.json()
      setRequests(data.requests || [])
      setStats(data.stats)
    } catch (error) {
      handleApiError(error, 'FetchRequests')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [filter.status, filter.type])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchRequests()
  }

  const handleAction = async (requestId: string, action: string, notes?: string) => {
    setProcessingId(requestId)
    try {
      const response = await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, adminNotes: notes })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update request')
      }

      fetchRequests()
      if (selectedRequest?.id === requestId) {
        const data = await response.json()
        setSelectedRequest(data.request)
      }
    } catch (error) {
      handleApiError(error, `RequestAction-${action}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleAddNotes = async () => {
    if (!selectedRequest || !notesText.trim()) return
    
    setSavingNotes(true)
    try {
      const response = await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId: selectedRequest.id, 
          action: 'UPDATE_NOTES', 
          adminNotes: notesText 
        })
      })

      if (!response.ok) throw new Error('Failed to add notes')
      
      const data = await response.json()
      setSelectedRequest(data.request)
      setNotesText('')
    } catch (error) {
      handleApiError(error, 'AddNotes')
    } finally {
      setSavingNotes(false)
    }
  }

  const filteredRequests = requests.filter(req => {
    if (!filter.search) return true
    const search = filter.search.toLowerCase()
    return (
      req.title.toLowerCase().includes(search) ||
      req.type.toLowerCase().includes(search) ||
      req.user.email.toLowerCase().includes(search) ||
      req.user.name?.toLowerCase().includes(search)
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'FAILED':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'PROJECT_EXPORT_REQUEST': 'Export',
      'THUMBNAIL_REGENERATION': 'Thumbnails',
      'FACE_RECOGNITION': 'Face Recog',
      'WATERMARK_ENABLE': 'Watermark',
      'SHARE_REQUEST': 'Share'
    }
    return labels[type] || type
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
              <ListChecks className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">PRO Requests</h1>
              <p className="text-muted-foreground">Track and manage user requests</p>
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div 
            onClick={() => setFilter({ ...filter, status: '' })}
            className={`p-4 bg-card border border-border rounded-lg cursor-pointer transition-colors ${!filter.status ? 'ring-2 ring-primary' : ''}`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <div 
            onClick={() => setFilter({ ...filter, status: 'PENDING' })}
            className={`p-4 bg-card border border-border rounded-lg cursor-pointer transition-colors ${filter.status === 'PENDING' ? 'ring-2 ring-yellow-500' : ''}`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-yellow-500">Pending</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.pending}</p>
          </div>
          <div 
            onClick={() => setFilter({ ...filter, status: 'IN_PROGRESS' })}
            className={`p-4 bg-card border border-border rounded-lg cursor-pointer transition-colors ${filter.status === 'IN_PROGRESS' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-sm text-blue-500">In Progress</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.inProgress}</p>
          </div>
          <div 
            onClick={() => setFilter({ ...filter, status: 'COMPLETED' })}
            className={`p-4 bg-card border border-border rounded-lg cursor-pointer transition-colors ${filter.status === 'COMPLETED' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500">Completed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.completed}</p>
          </div>
          <div 
            onClick={() => setFilter({ ...filter, status: 'FAILED' })}
            className={`p-4 bg-card border border-border rounded-lg cursor-pointer transition-colors ${filter.status === 'FAILED' ? 'ring-2 ring-red-500' : ''}`}
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-500">Failed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.failed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search requests..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            <option value="PROJECT_EXPORT_REQUEST">Export</option>
            <option value="THUMBNAIL_REGENERATION">Thumbnail Regeneration</option>
            <option value="FACE_RECOGNITION">Face Recognition</option>
            <option value="WATERMARK_ENABLE">Watermark</option>
            <option value="SHARE_REQUEST">Share Request</option>
          </select>
          {filter.status && (
            <button
              onClick={() => setFilter({ ...filter, status: '' })}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Request List */}
            <div className="lg:col-span-2 bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Request</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRequests.map((req) => (
                      <tr 
                        key={req.id} 
                        onClick={() => setSelectedRequest(req)}
                        className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedRequest?.id === req.id ? 'bg-muted/50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{req.title}</p>
                            {req.project && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <FolderOpen className="w-3 h-3" />
                                {req.project.name}
                              </div>
                            )}
                            {req.album && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <Layers className="w-3 h-3" />
                                {req.album.name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{getTypeLabel(req.type)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{req.user.name || req.user.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(req.status)}`}>
                            {req.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRequests.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No requests found
                  </div>
                )}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="bg-card border border-border rounded-lg p-4 h-fit sticky top-20">
              {selectedRequest ? (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{selectedRequest.title}</h3>
                      <p className="text-sm text-muted-foreground">{getTypeLabel(selectedRequest.type)}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedRequest.status)}`}>
                      {selectedRequest.status.replace('_', ' ')}
                    </span>
                  </div>

                  {selectedRequest.description && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-1">Description</p>
                      <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Requested by</p>
                    <p className="text-sm">{selectedRequest.user.name || selectedRequest.user.email}</p>
                    <p className="text-xs text-muted-foreground">{selectedRequest.user.role}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {selectedRequest.completedAt && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-1">Completed</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedRequest.completedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="border-t border-border pt-4 mb-4">
                    <p className="text-sm font-medium mb-2">Quick Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.status === 'PENDING' && (
                        <button
                          onClick={() => handleAction(selectedRequest.id, 'START')}
                          disabled={processingId === selectedRequest.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors text-sm disabled:opacity-50"
                        >
                          <Play className="w-3 h-3" />
                          Start
                        </button>
                      )}
                      {selectedRequest.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleAction(selectedRequest.id, 'COMPLETE')}
                          disabled={processingId === selectedRequest.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors text-sm disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Complete
                        </button>
                      )}
                      {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'IN_PROGRESS') && (
                        <button
                          onClick={() => handleAction(selectedRequest.id, 'REJECT')}
                          disabled={processingId === selectedRequest.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-sm disabled:opacity-50"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      )}
                      {selectedRequest.status === 'FAILED' && (
                        <button
                          onClick={() => handleAction(selectedRequest.id, 'RETRY')}
                          disabled={processingId === selectedRequest.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg hover:bg-yellow-500/20 transition-colors text-sm disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Retry
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="border-t border-border pt-4">
                    <button
                      onClick={() => setShowNotes(!showNotes)}
                      className="flex items-center gap-1 text-sm font-medium mb-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Notes ({selectedRequest.adminNotes ? '1' : '0'})
                    </button>
                    
                    {showNotes && (
                      <div>
                        {selectedRequest.adminNotes && (
                          <div className="mb-3 p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                            {selectedRequest.adminNotes}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder="Add a note..."
                            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNotes()}
                          />
                          <button
                            onClick={handleAddNotes}
                            disabled={savingNotes || !notesText.trim()}
                            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ListChecks className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Select a request to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
