'use client'

import { useEffect, useState, useRef } from 'react'
import { Folder, Plus, MoreVertical, Pencil, Trash2, Share2, Image, Loader2, ArrowLeft, Search, Copy, QrCode, X, ExternalLink, Settings, FolderOpen, Package, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { handleApiError, showSuccess, showWarning } from '@/lib/error-handler'
import QRCode from 'qrcode'

interface Project {
  id: string
  name: string
  description: string | null
  eventName?: string | null
  startDate?: string | null
  branding?: boolean
  coverImage?: string | null
  imageCount: number
  albumCount?: number
  albums?: { id: string; name: string }[]
  storageQuota: string
  storageUsed: string
}

interface ShareLink {
  id: string
  token: string
  projectId: string
  projectName: string
  expiresAt: string | null
  maxAccesses: number | null
  accessCount: number
  createdAt: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [newEventName, setNewEventName] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newBranding, setNewBranding] = useState(false)
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [createdProject, setCreatedProject] = useState<Project | null>(null)
  const [shareLink, setShareLink] = useState<ShareLink | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [sharingProjectId, setSharingProjectId] = useState<string | null>(null)
  const [exportingProject, setExportingProject] = useState<Project | null>(null)
  const [exportAll, setExportAll] = useState(true)
  const [selectedAlbumId, setSelectedAlbumId] = useState('')
  const [exporting, setExporting] = useState(false)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      handleApiError(error, 'FetchProjects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim() || undefined,
          eventName: newEventName.trim() || undefined,
          startDate: newStartDate || undefined,
          branding: newBranding
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create project')
      }

      const data = await response.json()
      showSuccess('Project created successfully!')
      
      setCreatedProject(data.project)
      setShowCreateModal(false)
      setNewProjectName('')
      setNewProjectDesc('')
      setNewEventName('')
      setNewStartDate('')
      setNewBranding(false)
      
      fetchProjects()
    } catch (error) {
      handleApiError(error, 'CreateProject')
    } finally {
      setCreating(false)
    }
  }

  const createShareLink = async (projectId: string) => {
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      if (response.ok) {
        const data = await response.json()
        setShareLink(data.share)
        setShowShareModal(true)
        
        const baseUrl = window.location.origin
        const shareUrl = `${baseUrl}/share/${data.share.token}`
        
        if (qrCanvasRef.current) {
          QRCode.toCanvas(qrCanvasRef.current, shareUrl, { 
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          })
        }
        
        setQrCodeUrl(shareUrl)
      }
    } catch (error) {
      console.error('Failed to create share link:', error)
    }
  }

  const handleCopyLink = () => {
    if (qrCodeUrl) {
      navigator.clipboard.writeText(qrCodeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadQR = () => {
    if (qrCanvasRef.current) {
      const link = document.createElement('a')
      link.download = `qr-code-${createdProject?.name || 'project'}.png`
      link.href = qrCanvasRef.current.toDataURL('image/png')
      link.click()
    }
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete project')

      showSuccess('Project deleted successfully')
      fetchProjects()
    } catch (error) {
      handleApiError(error, 'DeleteProject')
    }
  }

  const openExportModal = async (project: Project) => {
    setExportingProject(project)
    setExportAll(true)
    setSelectedAlbumId('')
    
    if (!project.albums) {
      try {
        const response = await fetch(`/api/projects/${project.id}?includeAlbums=true`)
        if (response.ok) {
          const data = await response.json()
          setExportingProject({ ...project, albums: data.project?.albums || [] })
        }
      } catch (error) {
        console.error('Failed to fetch albums:', error)
      }
    }
    
    setShowExportModal(true)
  }

  const handleExportRequest = async () => {
    if (!exportingProject) return

    setExporting(true)
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PROJECT_EXPORT_REQUEST',
          title: `Export: ${exportingProject.name}`,
          description: exportAll ? 'Export all albums' : `Export selected album`,
          payload: {
            projectId: exportingProject.id,
            albumId: exportAll ? null : selectedAlbumId,
            exportAll
          }
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit export request')
      }

      showSuccess('Export request submitted! We will process it shortly.')
      setShowExportModal(false)
      setExportingProject(null)
    } catch (error) {
      handleApiError(error, 'ExportRequest')
    } finally {
      setExporting(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/gallery"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Folder className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Projects</h1>
              <p className="text-muted-foreground">Organize your images into projects</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <Link href={`/projects/${project.id}`} className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Folder className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold mb-1 truncate">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openExportModal(project)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Request Export"
                    >
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => {
                        setCreatedProject(project)
                        createShareLink(project.id)
                      }}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <Link 
                      href={`/projects/${project.id}?tab=settings`}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    </Link>
                    <button 
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    {project.imageCount} images
                  </div>
                  {project.albumCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <FolderOpen className="w-4 h-4" />
                      {project.albumCount} albums
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Storage</span>
                    <span>{formatBytes(Number(project.storageUsed))} / {formatBytes(Number(project.storageQuota))}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${Math.min((Number(project.storageUsed) / Number(project.storageQuota)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-primary hover:underline"
            >
              Create your first project
            </button>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Project</h2>
              <form onSubmit={handleCreateProject}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Project Name</label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g., Wedding Photography"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Event / Project Name</label>
                    <input
                      type="text"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      placeholder="e.g., John & Jane Wedding"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description (optional)</label>
                    <textarea
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      placeholder="Brief description of the project..."
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="branding"
                      checked={newBranding}
                      onChange={(e) => setNewBranding(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <label htmlFor="branding" className="text-sm font-medium">
                      Enable branding/watermark
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newProjectName.trim()}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showShareModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Share Project</h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-center mb-6">
                <p className="text-muted-foreground mb-2">
                  Share your project <strong>{createdProject?.name}</strong>
                </p>
              </div>

              <div className="flex justify-center mb-6">
                <canvas ref={qrCanvasRef} className="rounded-lg" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Share Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrCodeUrl}
                      readOnly
                      className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <span className="text-green-500 text-sm">Copied!</span>
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadQR}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    Download QR
                  </button>
                  <a
                    href={qrCodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Link
                  </a>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Share this QR code or link with your clients to let them view the project.
              </p>
            </div>
          </div>
        )}

        {showExportModal && exportingProject && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Request Project Export</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-muted-foreground mb-2">
                  Request an export of <strong>{exportingProject.name}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  We will prepare a ZIP file for download. You will be notified when it's ready.
                </p>
              </div>

              {exportingProject.albums && exportingProject.albums.length > 0 && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={exportAll}
                        onChange={() => setExportAll(true)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">All Albums</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!exportAll}
                        onChange={() => setExportAll(false)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Selected Album</span>
                    </label>
                  </div>

                  {!exportAll && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Album</label>
                      <select
                        value={selectedAlbumId}
                        onChange={(e) => setSelectedAlbumId(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      >
                        <option value="">Select album...</option>
                        {exportingProject.albums.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportRequest}
                  disabled={exporting || (!exportAll && !selectedAlbumId)}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      Request Export
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
