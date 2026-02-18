'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { FolderOpen, Users, Shield, Clock, Loader2, Search, Edit, Trash2, Eye, EyeOff, Check, X, ExternalLink, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { handleApiError, showSuccess } from '@/lib/error-handler'

type AccessLevel = 'READ' | 'WRITE' | 'FULL'

interface ProjectAccess {
  userId: string
  userName: string
  userEmail: string
  accessLevel: AccessLevel
}

interface Project {
  id: string
  name: string
  description: string | null
  ownerId: string
  ownerName: string
  ownerEmail: string
  quotaBytes: string
  storageUsed: string
  accessList: ProjectAccess[]
  createdAt: string
  updatedAt: string
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [accessChanges, setAccessChanges] = useState<Record<string, ProjectAccess[]>>({})

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      handleApiError(error, 'FetchAdminProjects')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAccess = async (projectId: string) => {
    const changes = accessChanges[projectId]
    if (!changes) return

    try {
      const response = await fetch('/api/admin/projects/access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, accessList: changes })
      })

      if (response.ok) {
        showSuccess('Access list updated')
        setEditingProject(null)
        setAccessChanges(prev => {
          const next = { ...prev }
          delete next[projectId]
          return next
        })
        fetchProjects()
      }
    } catch (error) {
      handleApiError(error, 'UpdateAccess')
    }
  }

  const updateAccessLevel = (projectId: string, userId: string, level: AccessLevel) => {
    setAccessChanges(prev => {
      const projectAccess = prev[projectId] || projects.find(p => p.id === projectId)?.accessList || []
      const updated = projectAccess.map(a => 
        a.userId === userId ? { ...a, accessLevel: level } : a
      )
      return { ...prev, [projectId]: updated }
    })
  }

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatBytes = (bytes: string) => {
    const b = Number(bytes)
    if (b === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(b) / Math.log(k))
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAccessBadge = (level: AccessLevel) => {
    switch (level) {
      case 'READ':
        return <span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-500 rounded-full">R</span>
      case 'WRITE':
        return <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-500 rounded-full">W</span>
      case 'FULL':
        return <span className="px-2 py-0.5 text-xs bg-red-500/10 text-red-500 rounded-full">Full</span>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-green-500" />
              Project Management
            </h1>
            <p className="text-muted-foreground">Manage all projects, owners, and access permissions</p>
          </div>
          <button
            onClick={fetchProjects}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Loader2 className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects by name, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Projects Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No projects found</p>
        </div>
      ) : (
        <div className="px-6 pb-8">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-sm font-medium">Project</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Owner</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Storage</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Access List</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Created</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Last Modified</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(project => (
                  <tr key={project.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div>
                        <Link href={`/projects/${project.id}`} className="font-medium hover:text-primary hover:underline">
                          {project.name}
                        </Link>
                        {project.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">{project.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{project.ownerName}</p>
                          <p className="text-xs text-muted-foreground">{project.ownerEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{formatBytes(project.storageUsed)} / {formatBytes(project.quotaBytes)}</div>
                      <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min((Number(project.storageUsed) / Number(project.quotaBytes)) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingProject === project.id ? (
                        <div className="space-y-1">
                          {(accessChanges[project.id] || project.accessList).map(access => (
                            <div key={access.userId} className="flex items-center gap-2 text-sm">
                              <span className="truncate max-w-[100px]">{access.userName}</span>
                              <select
                                value={access.accessLevel}
                                onChange={(e) => updateAccessLevel(project.id, access.userId, e.target.value as AccessLevel)}
                                className="px-2 py-0.5 text-xs bg-background border border-border rounded"
                              >
                                <option value="READ">R</option>
                                <option value="WRITE">W</option>
                                <option value="FULL">Full</option>
                              </select>
                            </div>
                          ))}
                          <div className="flex gap-1 mt-2">
                            <button
                              onClick={() => handleSaveAccess(project.id)}
                              className="p-1 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingProject(null)
                                setAccessChanges(prev => {
                                  const next = { ...prev }
                                  delete next[project.id]
                                  return next
                                })
                              }}
                              className="p-1 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex -space-x-2">
                          {project.accessList.slice(0, 3).map(access => (
                            <div 
                              key={access.userId}
                              className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs"
                              title={`${access.userName}: ${access.accessLevel}`}
                            >
                              {getAccessBadge(access.accessLevel)}
                            </div>
                          ))}
                          {project.accessList.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                              +{project.accessList.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(project.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/projects/${project.id}`}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="View Project"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Link>
                        <button
                          onClick={() => setEditingProject(project.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Manage access"
                        >
                          <Shield className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
