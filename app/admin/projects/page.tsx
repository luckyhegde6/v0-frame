'use client'

import { useEffect, useState } from 'react'
import { 
  FolderOpen, Users, Shield, Loader2, Search, Eye, HardDrive,
  Check, X, Package, Plus, Trash2, Mail
} from 'lucide-react'
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
  const [accessModalProject, setAccessModalProject] = useState<Project | null>(null)
  const [accessList, setAccessList] = useState<ProjectAccess[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newLevel, setNewLevel] = useState<AccessLevel>('READ')
  const [saving, setSaving] = useState(false)
  const [addingUser, setAddingUser] = useState(false)
  const [exportingProjectId, setExportingProjectId] = useState<string | null>(null)

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

  const openAccessModal = (project: Project) => {
    setAccessModalProject(project)
    setAccessList([...project.accessList])
    setNewEmail('')
    setNewLevel('READ')
  }

  const closeAccessModal = () => {
    setAccessModalProject(null)
    setAccessList([])
  }

  const handleAddUser = async () => {
    if (!accessModalProject || !newEmail.trim()) return
    
    setAddingUser(true)
    try {
      const response = await fetch('/api/admin/projects/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: accessModalProject.id,
          userEmail: newEmail.trim(),
          accessLevel: newLevel
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add user')
      }

      // Refresh the access list from server to get the actual user ID
      const projectResponse = await fetch(`/api/admin/projects?id=${accessModalProject.id}`)
      if (projectResponse.ok) {
        const projectData = await projectResponse.json()
        setAccessList(projectData.project?.accessList || [])
      }
      
      setNewEmail('')
      setNewLevel('READ')
      showSuccess('User access added')
      fetchProjects()
    } catch (error) {
      handleApiError(error, 'AddUser')
    } finally {
      setAddingUser(false)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!accessModalProject) return
    
    try {
      await fetch(`/api/admin/projects/access?projectId=${accessModalProject.id}&userId=${userId}`, {
        method: 'DELETE'
      })
      setAccessList(prev => prev.filter(a => a.userId !== userId))
      showSuccess('User access removed')
    } catch (error) {
      handleApiError(error, 'RemoveUser')
    }
  }

  const handleSaveAccess = async () => {
    if (!accessModalProject) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/admin/projects/access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: accessModalProject.id,
          accessList: accessList.map(a => ({ userId: a.userId, accessLevel: a.accessLevel }))
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      showSuccess('Access list updated')
      closeAccessModal()
      fetchProjects()
    } catch (error) {
      handleApiError(error, 'SaveAccess')
    } finally {
      setSaving(false)
    }
  }

  const handleExportProject = async (project: Project) => {
    setExportingProjectId(project.id)
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PROJECT_EXPORT_REQUEST',
          title: `Export: ${project.name}`,
          description: 'Admin-initiated project export',
          payload: {
            projectId: project.id,
            exportAll: true
          }
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to request export')
      }

      showSuccess('Export request submitted')
    } catch (error) {
      handleApiError(error, 'ExportProject')
    } finally {
      setExportingProjectId(null)
    }
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
      day: 'numeric'
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
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

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
                  <th className="text-left px-4 py-3 text-sm font-medium">Access</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Created</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(project => (
                  <tr key={project.id} className="border-b border-border last:border-0 hover:bg-muted/20">
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
                        {project.accessList.length === 0 && (
                          <span className="text-xs text-muted-foreground">No access</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(project.createdAt)}
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
                        <Link
                          href={`/admin/projects/${project.id}/structure`}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="View storage structure"
                        >
                          <HardDrive className="w-4 h-4 text-muted-foreground" />
                        </Link>
                        <button
                          onClick={() => openAccessModal(project)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Manage access"
                        >
                          <Shield className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleExportProject(project)}
                          disabled={exportingProjectId === project.id}
                          className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                          title="Request Export"
                        >
                          {exportingProjectId === project.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Package className="w-4 h-4 text-muted-foreground" />
                          )}
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

      {accessModalProject && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Manage Access</h2>
              <button onClick={closeAccessModal} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground mb-1">Project</p>
              <p className="font-medium">{accessModalProject.name}</p>
              <p className="text-sm text-muted-foreground mt-1">Owner: {accessModalProject.ownerName} ({accessModalProject.ownerEmail})</p>
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Add User Access</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="User email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as AccessLevel)}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="READ">Read</option>
                  <option value="WRITE">Write</option>
                  <option value="FULL">Full</option>
                </select>
                <button
                  onClick={handleAddUser}
                  disabled={addingUser || !newEmail.trim()}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {addingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="font-medium mb-3">Current Access ({accessList.length})</h3>
              {accessList.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No additional users have access</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {accessList.map((access) => (
                    <div key={access.userId} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="text-sm">{access.userEmail}</span>
                          {access.userName && access.userName !== access.userEmail && (
                            <span className="text-xs text-muted-foreground ml-1">({access.userName})</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={access.accessLevel}
                          onChange={(e) => setAccessList(prev => 
                            prev.map(a => a.userId === access.userId ? { ...a, accessLevel: e.target.value as AccessLevel } : a)
                          )}
                          className="px-2 py-1 bg-background border border-border rounded text-xs"
                        >
                          <option value="READ">Read</option>
                          <option value="WRITE">Write</option>
                          <option value="FULL">Full</option>
                        </select>
                        <button
                          onClick={() => handleRemoveUser(access.userId)}
                          className="p-1 hover:bg-red-500/10 text-red-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeAccessModal} className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted">
                Cancel
              </button>
              <button onClick={handleSaveAccess} disabled={saving} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
