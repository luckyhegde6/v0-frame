'use client'

import { useEffect, useState } from 'react'
import { FolderOpen, Image as ImageIcon, Layers, ArrowRight, Copy, Scissors, GitBranch, ArrowLeft, RefreshCw, Loader2, Trash2, Check, X, Users, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { handleApiError } from '@/lib/error-handler'

interface GalleryImage {
  id: string
  title: string
  userId: string
  sizeBytes: number
  status: string
  createdAt: string
}

interface Collection {
  id: string
  name: string
  userId: string
  imageCount: number
  createdAt: string
}

interface Project {
  id: string
  name: string
  ownerId: string
  imageCount: number
  createdAt: string
}

interface User {
  id: string
  name: string | null
  email: string | null
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [targetUserId, setTargetUserId] = useState('')
  const [targetProjectId, setTargetProjectId] = useState('')
  const [operating, setOperating] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)

  const fetchData = async () => {
    try {
      const [galleryRes, usersRes] = await Promise.all([
        fetch('/api/admin/gallery'),
        fetch('/api/admin/users')
      ])

      if (galleryRes.ok) {
        const galleryData = await galleryRes.json()
        setImages(galleryData.images || [])
        setCollections(galleryData.collections || [])
        setProjects(galleryData.projects || [])
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }
    } catch (error) {
      handleApiError(error, 'FetchGalleryData')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const selectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([])
    } else {
      setSelectedImages(images.map(img => img.id))
    }
  }

  const handleMove = async () => {
    if (!targetUserId && !targetProjectId) return

    setOperating(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/gallery/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          imageIds: selectedImages,
          targetUserId: targetUserId || null,
          targetProjectId: targetProjectId || null
        })
      })

      const data = await response.json()
      setResult(data)

      if (data.success > 0) {
        setSelectedImages([])
        fetchData()
      }
    } catch (error) {
      handleApiError(error, 'MoveImages')
    } finally {
      setOperating(false)
    }
  }

  const handleCopy = async () => {
    if (!targetUserId) return

    setOperating(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/gallery/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copy',
          imageIds: selectedImages,
          targetUserId
        })
      })

      const data = await response.json()
      setResult(data)

      if (data.success > 0) {
        setSelectedImages([])
        fetchData()
      }
    } catch (error) {
      handleApiError(error, 'CopyImages')
    } finally {
      setOperating(false)
    }
  }

  const handleClone = async () => {
    setOperating(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/gallery/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clone',
          imageIds: selectedImages
        })
      })

      const data = await response.json()
      setResult(data)

      if (data.success > 0) {
        setSelectedImages([])
        fetchData()
      }
    } catch (error) {
      handleApiError(error, 'CloneImages')
    } finally {
      setOperating(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const closeModals = () => {
    setShowMoveModal(false)
    setShowCopyModal(false)
    setTargetUserId('')
    setTargetProjectId('')
    setResult(null)
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
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gallery Management</h1>
              <p className="text-muted-foreground">Move, copy, or clone images across users and projects</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{images.length}</p>
                <p className="text-sm text-muted-foreground">Total Images</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Layers className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{collections.length}</p>
                <p className="text-sm text-muted-foreground">Collections</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        {selectedImages.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMoveModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                >
                  <Scissors className="w-4 h-4" />
                  Move
                </button>
                <button
                  onClick={() => setShowCopyModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={handleClone}
                  disabled={operating}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                >
                  {operating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <GitBranch className="w-4 h-4" />
                  )}
                  Clone
                </button>
                <button
                  onClick={() => setSelectedImages([])}
                  className="px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-6 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedImages.length === images.length && images.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm font-medium">Select All</span>
              </div>
            </div>
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-10 px-6 py-3"></th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Image</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Size</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {images.map((image) => (
                  <tr key={image.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image.id)}
                        onChange={() => toggleImageSelection(image.id)}
                        className="w-4 h-4 rounded border-border"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{image.title || 'Untitled'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {users.find(u => u.id === image.userId)?.email || image.userId}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {formatBytes(image.sizeBytes)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        image.status === 'STORED' ? 'bg-green-500/10 text-green-500' :
                        image.status === 'PROCESSING' ? 'bg-yellow-500/10 text-yellow-500' :
                        image.status === 'FAILED' ? 'bg-red-500/10 text-red-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {image.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(image.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {images.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No images found
              </div>
            )}
          </div>
        )}
      </main>

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModals} />
          <div className="relative bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                Move Images
              </h2>
              <button onClick={closeModals} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target User</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Or Target Project</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select project...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.imageCount} images)
                    </option>
                  ))}
                </select>
              </div>

              {result && (
                <div className={`p-3 rounded-lg ${result.failed > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                  <p className={`text-sm ${result.failed > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {result.success} succeeded, {result.failed} failed
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMove}
                  disabled={operating || (!targetUserId && !targetProjectId)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {operating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Move
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModals} />
          <div className="relative bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Copy className="w-5 h-5" />
                Copy Images
              </h2>
              <button onClick={closeModals} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target User</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>

              {result && (
                <div className={`p-3 rounded-lg ${result.failed > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                  <p className={`text-sm ${result.failed > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {result.success} succeeded, {result.failed} failed
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopy}
                  disabled={operating || !targetUserId}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {operating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
