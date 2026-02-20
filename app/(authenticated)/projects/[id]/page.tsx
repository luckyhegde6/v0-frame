'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Folder, ArrowLeft, Loader2, Settings, Users, Image, 
  Share2, QrCode, Copy, X, ExternalLink, Calendar, 
  Palette, Image as ImageIcon, Plus, Trash2, Pencil,
  MoreVertical, Download, Eye, Film, FileImage, Video, Play, Upload, RefreshCw
} from 'lucide-react'
import { handleApiError, showSuccess } from '@/lib/error-handler'
import QRCode from 'qrcode'

interface Project {
  id: string
  name: string
  description: string | null
  eventName: string | null
  startDate: string | null
  branding: boolean
  watermarkImage: string | null
  coverImage: string | null
  imageCount: number
  storageQuota: string
  storageUsed: string
  createdAt: string
  updatedAt: string
}

interface Album {
  id: string
  name: string
  description: string | null
  category: string
  imageCount: number
  coverImage: string | null
}

interface Client {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  userImage: string | null
  accessLevel: string
  grantedAt: string
}

interface ShareLink {
  id: string
  token: string
  projectId: string
  expiresAt: string | null
  accessCount: number
  createdAt: string
}

type TabType = 'overview' | 'albums' | 'clients' | 'settings'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [albums, setAlbums] = useState<Album[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showShareModal, setShowShareModal] = useState(false)
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false)
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumCategory, setNewAlbumCategory] = useState('PHOTO_ALBUM')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [newClientEmail, setNewClientEmail] = useState('')
  const [newClientAccess, setNewClientAccess] = useState('READ')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [users, setUsers] = useState<{id: string, name: string | null, email: string | null}[]>([])
  const [searchEmail, setSearchEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Fetch current user info to get role
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUserRole(data.user.role)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  useEffect(() => {
    if (activeTab === 'albums') fetchAlbums()
    if (activeTab === 'clients') fetchClients()
    if (activeTab === 'settings') fetchShareLinks()
  }, [activeTab, projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
      } else {
        router.push('/projects')
      }
    } catch (error) {
      handleApiError(error, 'FetchProject')
    } finally {
      setLoading(false)
    }
  }

  const fetchAlbums = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/albums`)
      if (response.ok) {
        const data = await response.json()
        setAlbums(data.albums || [])
      }
    } catch (error) {
      handleApiError(error, 'FetchAlbums')
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/clients`)
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      handleApiError(error, 'FetchClients')
    }
  }

  const fetchShareLinks = async () => {
    try {
      const response = await fetch('/api/share')
      if (response.ok) {
        const data = await response.json()
        setShareLinks(data.shares?.filter((s: ShareLink) => s.projectId === projectId) || [])
      }
    } catch (error) {
      handleApiError(error, 'FetchShareLinks')
    }
  }

  const fetchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([])
      return
    }
    try {
      const response = await fetch(`/api/admin/users?search=${query}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAlbumName.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAlbumName.trim(),
          category: newAlbumCategory,
          projectId
        })
      })

      if (response.ok) {
        showSuccess('Album created successfully!')
        setShowCreateAlbumModal(false)
        setNewAlbumName('')
        fetchAlbums()
      }
    } catch (error) {
      handleApiError(error, 'CreateAlbum')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateShareLink = async () => {
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      if (response.status === 409) {
        const data = await response.json()
        alert('A share link already exists for this project. Only one share link is allowed per project.')
        return
      }

      if (response.ok) {
        const data = await response.json()
        const baseUrl = window.location.origin
        const shareUrl = `${baseUrl}/share/${data.share.token}`
        
        if (qrCanvasRef.current) {
          QRCode.toCanvas(qrCanvasRef.current, shareUrl, { 
            width: 200,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
          })
        }
        
        setQrCodeUrl(shareUrl)
        setShowShareModal(true)
        fetchShareLinks()
      }
    } catch (error) {
      handleApiError(error, 'CreateShareLink')
    }
  }

  const handleRegenerateShareLink = async () => {
    if (!confirm('Are you sure you want to regenerate the share link? This will invalidate the current link.')) {
      return
    }

    try {
      const response = await fetch('/api/share', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      if (response.ok) {
        const data = await response.json()
        showSuccess('Share link regenerated successfully!')
        fetchShareLinks()
      } else if (response.status === 403) {
        alert('Only ADMIN or SUPERADMIN can regenerate share links.')
      }
    } catch (error) {
      handleApiError(error, 'RegenerateShareLink')
    }
  }

  const handleRequestShareLink = async () => {
    try {
      const response = await fetch('/api/share/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      if (response.status === 409) {
        const data = await response.json()
        alert(data.error || 'A request already exists or link already exists.')
        return
      }

      if (response.ok) {
        const data = await response.json()
        showSuccess(data.message)
      }
    } catch (error) {
      handleApiError(error, 'RequestShareLink')
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId) {
      alert('Please select a user from the dropdown')
      return
    }

    setCreating(true)
    try {

      const response = await fetch(`/api/projects/${projectId}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedClientId,
          accessLevel: newClientAccess
        })
      })

      if (response.ok) {
        showSuccess('Client access granted!')
        setShowAddClientModal(false)
        setNewClientEmail('')
        setSelectedClientId('')
        setSearchEmail('')
        setUsers([])
        fetchClients()
      }
    } catch (error) {
      handleApiError(error, 'AddClient')
    } finally {
      setCreating(false)
    }
  }

  const handleRevokeClient = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke access?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/clients/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess('Access revoked')
        fetchClients()
      }
    } catch (error) {
      handleApiError(error, 'RevokeClient')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PHOTO_ALBUM': return FileImage
      case 'COVER_PAGE': return ImageIcon
      case 'SHORT_VIDEOS': return Film
      case 'REELS': return Play
      case 'SHORTS': return Video
      default: return Folder
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/projects"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {project.coverImage ? (
              <img src={project.coverImage} alt="" className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Folder className="w-8 h-8 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              {project.eventName && (
                <p className="text-muted-foreground">{project.eventName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${projectId}/upload`}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Link>
            <button
              onClick={handleCreateShareLink}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border mb-6">
          {(['overview', 'albums', 'clients', 'settings'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Project Details</h2>
                <dl className="grid grid-cols-2 gap-4">
                  {project.eventName && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Event Name</dt>
                      <dd className="font-medium">{project.eventName}</dd>
                    </div>
                  )}
                  {project.startDate && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Start Date</dt>
                      <dd className="font-medium">{new Date(project.startDate).toLocaleDateString()}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-muted-foreground">Branding</dt>
                    <dd className="font-medium">{project.branding ? 'Enabled' : 'Disabled'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Created</dt>
                    <dd className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
                {project.description && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <dt className="text-sm text-muted-foreground mb-1">Description</dt>
                    <dd>{project.description}</dd>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Storage</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Used</span>
                    <span>{formatBytes(Number(project.storageUsed))} / {formatBytes(Number(project.storageQuota))}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${Math.min((Number(project.storageUsed) / Number(project.storageQuota)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {project.imageCount} images
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'albums' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Albums</h2>
              <button
                onClick={() => setShowCreateAlbumModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                New Album
              </button>
            </div>

            {albums.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {albums.map((album) => {
                  const Icon = getCategoryIcon(album.category)
                  return (
                    <div
                      key={album.id}
                      className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
                    >
                      <Link href={`/projects/${projectId}/albums/${album.id}`}>
                        <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                          {album.coverImage ? (
                            <img src={album.coverImage} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Icon className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <h3 className="font-medium truncate">{album.name}</h3>
                        <p className="text-sm text-muted-foreground">{album.imageCount} images</p>
                      </Link>
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/projects/${projectId}/upload?albumId=${album.id}`}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20"
                        >
                          <Upload className="w-3 h-3" />
                          Upload
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No albums yet</p>
                <button
                  onClick={() => setShowCreateAlbumModal(true)}
                  className="text-primary hover:underline"
                >
                  Create your first album
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'clients' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Client Access</h2>
              <button
                onClick={() => setShowAddClientModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </button>
            </div>

            {clients.length > 0 ? (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Client</th>
                      <th className="text-left py-3 px-4 font-medium">Access Level</th>
                      <th className="text-left py-3 px-4 font-medium">Granted</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className="border-b border-border/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {client.userImage ? (
                                <img src={client.userImage} alt="" className="w-8 h-8 rounded-full" />
                              ) : (
                                <span className="text-sm">{client.userName?.[0] || '?'}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{client.userName || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">{client.userEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            client.accessLevel === 'FULL' ? 'bg-green-500/10 text-green-500' :
                            client.accessLevel === 'WRITE' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {client.accessLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(client.grantedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleRevokeClient(client.userId)}
                            className="p-2 hover:bg-muted rounded-lg text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No clients with access</p>
                <button
                  onClick={() => setShowAddClientModal(true)}
                  className="text-primary hover:underline"
                >
                  Add your first client
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Share Links</h2>
              <div className="flex gap-2 mb-4">
                {currentUserRole && (currentUserRole === 'ADMIN' || currentUserRole === 'SUPERADMIN') ? (
                  <button
                    onClick={handleCreateShareLink}
                    disabled={shareLinks.length > 0}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <QrCode className="w-4 h-4" />
                    {shareLinks.length > 0 ? 'Link Already Exists' : 'Generate Link'}
                  </button>
                ) : currentUserRole && shareLinks.length === 0 ? (
                  <button
                    onClick={handleRequestShareLink}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    <QrCode className="w-4 h-4" />
                    Request Link
                  </button>
                ) : null}
                {shareLinks.length > 0 && currentUserRole && (currentUserRole === 'PRO' || currentUserRole === 'USER') && (
                  <button
                    onClick={handleRegenerateShareLink}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Request Regeneration
                  </button>
                )}
              </div>

              {shareLinks.length > 0 ? (
                <div className="space-y-3">
                  {shareLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-mono">
                          {window.location.origin}/share/{link.token}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {link.accessCount} views • Created {new Date(link.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyLink(`${window.location.origin}/share/${link.token}`)}
                        className="p-2 hover:bg-background rounded-lg"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No share links yet. Generate one to share this project.</p>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Project Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name</label>
                  <input
                    type="text"
                    defaultValue={project.name}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Event Name</label>
                  <input
                    type="text"
                    defaultValue={project.eventName || ''}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    defaultValue={project.startDate?.split('T')[0] || ''}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="branding"
                    defaultChecked={project.branding}
                    className="w-4 h-4"
                  />
                  <label htmlFor="branding" className="text-sm font-medium">
                    Enable branding/watermark
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {showShareModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Share Project</h2>
                <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-muted rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex justify-center mb-6">
                <canvas ref={qrCanvasRef} className="rounded-lg" />
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrCodeUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                  <button
                    onClick={() => handleCopyLink(qrCodeUrl)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                  >
                    {copied ? <span className="text-green-500 text-sm">Copied!</span> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCreateAlbumModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create Album</h2>
              <form onSubmit={handleCreateAlbum}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Album Name</label>
                    <input
                      type="text"
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      placeholder="e.g., Ceremony Photos"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={newAlbumCategory}
                      onChange={(e) => setNewAlbumCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                    >
                      <option value="PHOTO_ALBUM">Photo Album</option>
                      <option value="COVER_PAGE">Cover Page</option>
                      <option value="SHORT_VIDEOS">Short Videos</option>
                      <option value="REELS">Reels</option>
                      <option value="SHORTS">Shorts</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateAlbumModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newAlbumName.trim()}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddClientModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Client</h2>
              <form onSubmit={handleAddClient}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Search User</label>
                    <input
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => {
                        setNewClientEmail(e.target.value)
                        fetchUsers(e.target.value)
                      }}
                      placeholder="Search by email..."
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                    />
                    {users.length > 0 && (
                      <div className="mt-2 border border-border rounded-lg max-h-32 overflow-y-auto">
                        {users.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setNewClientEmail(user.email || '')
                              setSelectedClientId(user.id)
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2"
                          >
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                              {user.name?.[0] || '?'}
                            </div>
                            <div>
                              <div className="text-sm">{user.name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Access Level</label>
                    <select
                      value={newClientAccess}
                      onChange={(e) => setNewClientAccess(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                    >
                      <option value="READ">Read Only</option>
                      <option value="WRITE">Read + Upload</option>
                      <option value="FULL">Full Access</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddClientModal(false)
                      setNewClientEmail('')
                      setSelectedClientId('')
                      setUsers([])
                    }}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newClientEmail}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
