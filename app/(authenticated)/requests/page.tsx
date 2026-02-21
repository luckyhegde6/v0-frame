'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Loader2, Send, Package, Image, Eye, 
  Palette, Share2, CheckCircle, Clock, XCircle, FileText
} from 'lucide-react'
import { handleApiError, showSuccess } from '@/lib/error-handler'

interface Request {
  id: string
  type: string
  status: string
  title: string
  description: string | null
  createdAt: string
  payload: Record<string, unknown> | null
}

interface Project {
  id: string
  name: string
  albums: { id: string; name: string }[]
}

const REQUEST_TYPES = [
  {
    value: 'PROJECT_EXPORT_REQUEST',
    label: 'Project Export',
    icon: Package,
    description: 'Request export of full project or selected albums as ZIP'
  },
  {
    value: 'THUMBNAIL_REGENERATION',
    label: 'Thumbnail Regeneration',
    icon: Image,
    description: 'Request regeneration of thumbnails for an album'
  },
  {
    value: 'FACE_RECOGNITION',
    label: 'Face Recognition',
    icon: Eye,
    description: 'Enable AI face detection on an album'
  },
  {
    value: 'WATERMARK_ENABLE',
    label: 'Watermark Setup',
    icon: Palette,
    description: 'Configure watermark for your images'
  },
  {
    value: 'SHARE_REQUEST',
    label: 'Share Link',
    icon: Share2,
    description: 'Request a shareable link for a project or album'
  }
]

export default function RequestsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [selectedType, setSelectedType] = useState(REQUEST_TYPES[0].value)
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedAlbum, setSelectedAlbum] = useState('')
  const [exportAll, setExportAll] = useState(true)
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsRes, requestsRes] = await Promise.all([
        fetch('/api/projects?limit=100&includeAlbums=true'),
        fetch('/api/requests')
      ])
      
      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data.projects || [])
      }
      
      if (requestsRes.ok) {
        const data = await requestsRes.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      handleApiError(error, 'FetchData')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProject && ['PROJECT_EXPORT_REQUEST', 'THUMBNAIL_REGENERATION', 'FACE_RECOGNITION', 'WATERMARK_ENABLE', 'SHARE_REQUEST'].includes(selectedType)) {
      showSuccess('Please select a project')
      return
    }

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        projectId: selectedProject,
        albumId: selectedAlbum || null,
        exportAll,
        description
      }

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          title: REQUEST_TYPES.find(t => t.value === selectedType)?.label || selectedType,
          description: description || REQUEST_TYPES.find(t => t.value === selectedType)?.description,
          payload
        })
      })

      if (response.ok) {
        showSuccess('Request submitted successfully')
        setSelectedType(REQUEST_TYPES[0].value)
        setSelectedProject('')
        setSelectedAlbum('')
        setExportAll(true)
        setDescription('')
        fetchData()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit request')
      }
    } catch (error) {
      handleApiError(error, 'SubmitRequest')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-blue-500" />
    }
  }

  const selectedProjectData = projects.find(p => p.id === selectedProject)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-3 flex items-center gap-4 sticky top-16 z-30 bg-background/80 backdrop-blur-sm">
        <Link
          href="/gallery"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gallery
        </Link>
      </div>

      <div className="border-b border-border px-6 py-4 bg-muted/50">
        <h1 className="text-2xl font-bold">Admin Requests</h1>
        <p className="text-muted-foreground">Submit requests for exports, face recognition, watermarks, and more</p>
      </div>

      <main className="px-6 py-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Request Form */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              New Request
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Request Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {REQUEST_TYPES.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setSelectedType(type.value)}
                        className={`flex items-center gap-3 p-3 border rounded-lg text-left transition-colors ${
                          selectedType === type.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {['PROJECT_EXPORT_REQUEST', 'THUMBNAIL_REGENERATION', 'FACE_RECOGNITION', 'WATERMARK_ENABLE', 'SHARE_REQUEST'].includes(selectedType) && (
                <div>
                  <label className="block text-sm font-medium mb-2">Project</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value)
                      setSelectedAlbum('')
                    }}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  >
                    <option value="">Select project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProjectData && selectedProjectData.albums.length > 0 && 
               ['PROJECT_EXPORT_REQUEST', 'THUMBNAIL_REGENERATION', 'FACE_RECOGNITION', 'WATERMARK_ENABLE', 'SHARE_REQUEST'].includes(selectedType) && (
                <>
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
                      <label className="block text-sm font-medium mb-2">Album</label>
                      <select
                        value={selectedAlbum}
                        onChange={(e) => setSelectedAlbum(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      >
                        <option value="">Select album...</option>
                        {selectedProjectData.albums.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any additional information..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg resize-none"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Request History */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Request History</h2>

            {requests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No requests yet</p>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    {getStatusIcon(req.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{req.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                      {req.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {req.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 bg-muted rounded capitalize">
                      {req.status.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
