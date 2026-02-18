'use client'

import { useEffect, useState } from 'react'
import { 
  FileText, Search, Download, ChevronLeft, ChevronRight,
  Loader2, Filter, Calendar, User, Activity
} from 'lucide-react'
import { handleApiError, showSuccess } from '@/lib/error-handler'

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string | null
  userId: string | null
  userEmail: string | null
  userName: string | null
  userRole: string | null
  description: string | null
  createdAt: string
}

const ACTION_LABELS: Record<string, string> = {
  USER_CREATED: 'User Created',
  USER_UPDATED: 'User Updated',
  USER_DELETED: 'User Deleted',
  USER_LOGIN: 'User Login',
  USER_LOGOUT: 'User Logout',
  PROJECT_CREATED: 'Project Created',
  PROJECT_UPDATED: 'Project Updated',
  PROJECT_DELETED: 'Project Deleted',
  ALBUM_CREATED: 'Album Created',
  ALBUM_UPDATED: 'Album Updated',
  ALBUM_DELETED: 'Album Deleted',
  SHARE_LINK_CREATED: 'Share Link Created',
  SHARE_LINK_REVOKED: 'Share Link Revoked',
  SHARE_LINK_ACCESSED: 'Share Link Accessed',
  JOB_CREATED: 'Job Created',
  JOB_STARTED: 'Job Started',
  JOB_COMPLETED: 'Job Completed',
  JOB_FAILED: 'Job Failed',
  STORAGE_USAGE_CHANGED: 'Storage Usage Changed',
  QUOTA_EXCEEDED: 'Quota Exceeded',
  ACCESS_GRANTED: 'Access Granted',
  ACCESS_REVOKED: 'Access Revoked',
  ACCESS_MODIFIED: 'Access Modified',
  SETTINGS_UPDATED: 'Settings Updated'
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    entityType: '',
    from: '',
    to: ''
  })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [pagination.page, filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      
      if (filters.action) params.set('action', filters.action)
      if (filters.userId) params.set('userId', filters.userId)
      if (filters.entityType) params.set('entityType', filters.entityType)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)

      const response = await fetch(`/api/audit?${params}`)
      if (!response.ok) throw new Error('Failed to fetch audit logs')
      
      const data = await response.json()
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (error) {
      handleApiError(error, 'FetchAuditLogs')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.action) params.set('action', filters.action)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      
      const response = await fetch(`/api/audit?${params}&limit=10000`)
      const data = await response.json()
      
      const csv = [
        ['Timestamp', 'Action', 'Entity Type', 'User', 'Email', 'Description'].join(','),
        ...data.logs.map((log: AuditLog) => [
          log.createdAt,
          log.action,
          log.entityType,
          log.userName || '',
          log.userEmail || '',
          log.description || ''
        ].map((v: string) => `"${v}"`).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      
      showSuccess('Audit logs exported successfully')
    } catch (error) {
      handleApiError(error, 'ExportAuditLogs')
    }
  }

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      log.action.toLowerCase().includes(query) ||
      log.entityType.toLowerCase().includes(query) ||
      log.userEmail?.toLowerCase().includes(query) ||
      log.userName?.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query)
    )
  })

  const actionOptions = Object.keys(ACTION_LABELS)
  const entityTypes = ['user', 'project', 'album', 'share', 'job', 'settings']

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">System activity and access history</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Actions</option>
                {actionOptions.map(action => (
                  <option key={action} value={action}>{ACTION_LABELS[action]}</option>
                ))}
              </select>
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Entities</option>
                {entityTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => handleFilterChange('from', e.target.value)}
                className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="From"
              />
              <input
                type="date"
                value={filters.to}
                onChange={(e) => handleFilterChange('to', e.target.value)}
                className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="To"
              />
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                      <th className="text-left py-3 px-4 font-medium">Action</th>
                      <th className="text-left py-3 px-4 font-medium">Entity</th>
                      <th className="text-left py-3 px-4 font-medium">User</th>
                      <th className="text-left py-3 px-4 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {log.entityType}
                          {log.entityId && <span className="text-muted-foreground text-xs ml-1">#{log.entityId.slice(0, 8)}</span>}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {log.userName || log.userEmail || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                          {log.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredLogs.length} of {pagination.total} logs
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
