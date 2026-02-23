'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Loader2, Trash2, RotateCcw, 
  Image, Package, AlertTriangle
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
}

export default function TrashPage() {
  const router = useRouter()
  const [images, setImages] = useState<DeletedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    fetchTrash()
  }, [])

  const fetchTrash = async () => {
    try {
      const response = await fetch('/api/trash')
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
    setRestoring(true)
    try {
      const response = await fetch('/api/trash', {
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
      setRestoring(false)
    }
  }

  const handleRestoreAll = async () => {
    if (images.length === 0) return
    setRestoring(true)
    try {
      const response = await fetch('/api/trash', {
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
      setRestoring(false)
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
    if (selectedImages.length === images.length) {
      setSelectedImages([])
    } else {
      setSelectedImages(images.map(img => img.id))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-6xl mx-auto">
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
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Trash</h1>
              <p className="text-muted-foreground">
                {images.length} image(s) in trash
              </p>
            </div>
          </div>
          
          {images.length > 0 && (
            <button
              onClick={handleRestoreAll}
              disabled={restoring}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Restore All
            </button>
          )}
        </div>

        {images.length > 0 && (
          <div className="mb-4 flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedImages.length === images.length && images.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm font-medium">
                {selectedImages.length > 0 ? `${selectedImages.length} selected` : 'Select all'}
              </span>
            </div>
            {selectedImages.length > 0 && (
              <button
                onClick={() => handleRestore(selectedImages)}
                disabled={restoring}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Restore Selected
              </button>
            )}
          </div>
        )}

        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((image) => (
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

                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRestore([image.id])}
                    disabled={restoring}
                    className="p-2 bg-primary rounded-lg hover:opacity-90"
                    title="Restore"
                  >
                    <RotateCcw className="w-4 h-4 text-primary-foreground" />
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
                
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs text-white truncate">{image.title || 'Untitled'}</p>
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
            <h2 className="text-xl font-semibold mb-2">Trash is empty</h2>
            <p className="text-muted-foreground mb-6">
              Images you delete from albums will appear here for 30 days
            </p>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Gallery
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
