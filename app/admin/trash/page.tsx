'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Loader2, Trash2, RotateCcw, 
  Image, Package, AlertTriangle, Search, User
} from 'lucide-react'
import { handleApiError, showSuccess } from '@/lib/error-handler'

interface DeletedImage {
  id: string
  title: string
  thumbnailPath: string | null
  previewPath: string | null
  width: number
  height: number
  mimeType: string
  deletedAt: string
  deletedFrom: string | null
  originalAlbumId: string | null
  albumName: string | null
  userId: string
  userName: string | null
  userEmail: string
}

export default function AdminTrashPage() {
  const router = useRouter()
  const [images, setImages] = useState<DeletedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterUser, setFilterUser] = useState('')

  useEffect(() => {
    fetchTrash()
  }, [filterUser])

  const fetchTrash = async () => {
    setLoading(true)
    try {
      let url = '/api/admin/trash'
      if (filterUser) {
        url += `?userId=${filterUser}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      }
    } catch (error) {
      console.error('Failed to fetch trash:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (imageIds: string[]) => {
    if (imageIds.length === 0) return
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds, action: 'restore' })
      })
      
      if (response.ok) {
        const data = await response.json()
        showSuccess(`Restored ${data.restoredCount} image(s)`)
        setImages(prev => prev.filter(img => !imageIds.includes(img.id)))
        setSelectedImages([])
      }
    } catch (error) {
      handleApiError(error, 'RestoreImages')
    } finally {
      setProcessing(false)
    }
  }

  const handlePermanentDelete = async (imageIds: string[]) => {
    if (imageIds.length === 0) return
    
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${imageIds.length} image(s)? This action cannot be undone.`
    )
    
    if (!confirmed) return
    
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds, action: 'permanent-delete' })
      })
      
      if (response.ok) {
        const data = await response.json()
        showSuccess(`Permanently deleted ${data.deletedCount} image(s)`)
        setImages(prev => prev.filter(img => !imageIds.includes(img.id)))
        setSelectedImages([])
      }
    } catch (error) {
      handleApiError(error, 'DeleteImages')
    } finally {
      setProcessing(false)
    }
  }

  const handleRestoreAll = async () => {
    if (images.length === 0) return
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: images.map(img => img.id), action: 'restore' })
      })
      
      if (response.ok) {
        const data = await response.json()
        showSuccess(`Restored all ${data.restoredCount} image(s)`)
        setImages([])
        setSelectedImages([])
      }
    } catch (error) {
      handleApiError(error, 'RestoreAll')
    } finally {
      setProcessing(false)
    }
  }

  const toggleSelection = (imageId: string) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const selectAll = () => {
    if (selectedImages.length === filteredImages.length) {
      setSelectedImages([])
    } else {
      setSelectedImages(filteredImages.map(img => img.id))
    }
  }

  const filteredImages = images.filter(img => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      img.title?.toLowerCase().includes(query) ||
      img.userEmail?.toLowerCase().includes(query) ||
      img.userName?.toLowerCase().includes(query) ||
      img.albumName?.toLowerCase().includes(query)
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Trash Management</h1>
              <p className="text-muted-foreground">
                {images.length} deleted image(s) in system
              </p>
            </div>
          </div>
          
          {images.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestoreAll}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Restore All
              </button>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        {images.length > 0 && (
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, user, album..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
          </div>
        )}

        {images.length > 0 && filteredImages.length > 0 && (
          <div className="mb-4 flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedImages.length === filteredImages.length && filteredImages.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm font-medium">
                {selectedImages.length > 0 ? `${selectedImages.length} selected` : 'Select all'}
              </span>
            </div>
            {selectedImages.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRestore(selectedImages)}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Restore
                </button>
                <button
                  onClick={() => handlePermanentDelete(selectedImages)}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Permanently
                </button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className={`relative aspect-square bg-muted rounded-lg overflow-hidden group ${
                  selectedImages.includes(image.id) ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedImages.includes(image.id)}
                    onChange={() => toggleSelection(image.id)}
                    className="w-4 h-4 rounded border-border"
                  />
                </div>

                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRestore([image.id])}
                    disabled={processing}
                    className="p-1.5 bg-primary rounded hover:opacity-90"
                    title="Restore"
                  >
                    <RotateCcw className="w-3 h-3 text-primary-foreground" />
                  </button>
                  <button
                    onClick={() => handlePermanentDelete([image.id])}
                    disabled={processing}
                    className="p-1.5 bg-red-600 rounded hover:bg-red-700"
                    title="Delete Permanently"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
                
                {image.thumbnailPath || image.previewPath ? (
                  <img
                    src={image.previewPath || image.thumbnailPath || ''}
                    alt={image.title || 'Deleted image'}
                    className="w-full h-full object-cover grayscale opacity-70"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                  <p className="text-xs text-white truncate font-medium">{image.title || 'Untitled'}</p>
                  <div className="flex items-center gap-1 text-xs text-white/60">
                    <User className="w-3 h-3" />
                    <span className="truncate">{image.userEmail}</span>
                  </div>
                  <p className="text-xs text-white/60 truncate">
                    Deleted {formatDate(image.deletedAt)}
                  </p>
                  {image.albumName && (
                    <p className="text-xs text-white/60 truncate">
                      From: {image.albumName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No matching images found' : 'Trash is empty'}
            </h2>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'No deleted images in the system'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
