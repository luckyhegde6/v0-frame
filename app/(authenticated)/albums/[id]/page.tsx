'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Loader2, Upload, Image, Download, 
  FileImage, Film, Video, Play, Package, Settings,
  Heart, X, ChevronLeft, ChevronRight, ZoomIn
} from 'lucide-react'
import { handleApiError, showSuccess } from '@/lib/error-handler'

interface Album {
  id: string
  name: string
  description: string | null
  category: string
  coverImage: string | null
  projectId?: string | null
  projectName?: string | null
  settings?: {
    downloadEnabled: boolean
    bulkDownloadEnabled: boolean
  }
}

interface AlbumImage {
  id: string
  title: string
  thumbnailPath: string | null
  previewPath: string | null
  width: number
  height: number
  mimeType: string
  originalPath: string | null
  isFavorite?: boolean
}

export default function UserAlbumDetailPage() {
  const params = useParams()
  const router = useRouter()
  const albumId = params.id as string
  
  const [album, setAlbum] = useState<Album | null>(null)
  const [images, setImages] = useState<AlbumImage[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxLoading, setLightboxLoading] = useState(true)

  useEffect(() => {
    if (albumId) {
      fetchAlbum()
      fetchImages()
    }
  }, [albumId])

  const fetchAlbum = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}`)
      if (response.ok) {
        const data = await response.json()
        setAlbum(data.album)
      } else {
        router.push('/albums')
      }
    } catch (error) {
      handleApiError(error, 'FetchAlbum')
    }
  }

  const fetchImages = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}/images`)
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      }
    } catch (error) {
      console.error('Failed to fetch images:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (imageId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const response = await fetch(`/api/images/${imageId}/favorite`, { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        setImages(prev => prev.map(img => 
          img.id === imageId ? { ...img, isFavorite: data.favorite } : img
        ))
      }
    } catch (error) {
      handleApiError(error, 'ToggleFavorite')
    }
  }

  const handleDownloadImage = async (imageId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/images/${imageId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName || 'image.jpg'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showSuccess('Image downloaded')
      }
    } catch (error) {
      handleApiError(error, 'DownloadImage')
    }
  }

  const handleBulkDownload = async () => {
    if (selectedImages.length === 0) return
    setDownloading(true)
    try {
      const response = await fetch(`/api/albums/${albumId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: selectedImages })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${album?.name || 'album'}-download.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showSuccess(`Downloaded ${selectedImages.length} images`)
      }
    } catch (error) {
      handleApiError(error, 'BulkDownload')
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadAll = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/albums/${albumId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadAll: true })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${album?.name || 'album'}-all.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showSuccess('Album downloaded')
      }
    } catch (error) {
      handleApiError(error, 'DownloadAll')
    } finally {
      setDownloading(false)
    }
  }

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const selectAllImages = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([])
    } else {
      setSelectedImages(images.map(img => img.id))
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PHOTO_ALBUM': return FileImage
      case 'COVER_PAGE': return Image
      case 'SHORT_VIDEOS': return Film
      case 'REELS': return Play
      case 'SHORTS': return Video
      default: return Image
    }
  }

  // Lightbox functions
  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextImage = () => {
    setLightboxIndex(prev => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setLightboxIndex(prev => (prev - 1 + images.length) % images.length)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!album) return null

  const Icon = getCategoryIcon(album.category)
  const canDownload = album.settings?.downloadEnabled !== false
  const canBulkDownload = album.settings?.bulkDownloadEnabled !== false
  const currentImage = images[lightboxIndex]

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          {album.projectId ? (
            <Link
              href={`/projects/${album.projectId}?tab=albums`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {album.projectName || 'Project'}
            </Link>
          ) : (
            <Link
              href="/albums"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Albums
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{album.name}</h1>
              <p className="text-muted-foreground">{album.category.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canBulkDownload && images.length > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                Download All
              </button>
            )}
          </div>
        </div>

        {album.description && (
          <p className="text-muted-foreground mb-6">{album.description}</p>
        )}

        {images.length > 0 && canBulkDownload && (
          <div className="mb-4 flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedImages.length === images.length && images.length > 0}
                onChange={selectAllImages}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm font-medium">
                {selectedImages.length > 0 ? `${selectedImages.length} selected` : 'Select all'}
              </span>
            </div>
            {selectedImages.length > 0 && (
              <button
                onClick={handleBulkDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download Selected
              </button>
            )}
          </div>
        )}

        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`relative aspect-square bg-muted rounded-lg overflow-hidden group cursor-pointer ${
                  canDownload ? 'cursor-pointer' : ''
                } ${selectedImages.includes(image.id) ? 'ring-2 ring-primary' : ''}`}
                onClick={() => openLightbox(index)}
              >
                {canBulkDownload && (
                  <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedImages.includes(image.id)}
                      onChange={() => toggleImageSelection(image.id)}
                      className="w-4 h-4 rounded border-border"
                    />
                  </div>
                )}
                
                {/* Favorite button */}
                <button
                  onClick={(e) => toggleFavorite(image.id, e)}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                >
                  <Heart 
                    className={`w-4 h-4 ${image.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                  />
                </button>
                
                {canDownload && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownloadImage(image.id, image.title || 'image.jpg')
                    }}
                    className="absolute top-10 right-2 z-10 p-1.5 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </button>
                )}
                
                {image.thumbnailPath || image.previewPath ? (
                  <img
                    src={image.previewPath || image.thumbnailPath || ''}
                    alt={image.title || 'Album image'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-xs text-white truncate">{image.title || 'Untitled'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No images in this album</p>
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightboxOpen && currentImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage() }}
                className="absolute left-4 p-2 text-white/80 hover:text-white"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage() }}
                className="absolute right-4 p-2 text-white/80 hover:text-white"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Favorite button */}
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              toggleFavorite(currentImage.id);
            }}
            className="absolute top-4 left-4 p-2 text-white/80 hover:text-white z-10"
          >
            <Heart 
              className={`w-6 h-6 ${currentImage.isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
            />
          </button>

          {/* Download button */}
          {canDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadImage(currentImage.id, currentImage.title || 'image.jpg')
              }}
              className="absolute top-4 left-16 p-2 text-white/80 hover:text-white z-10"
            >
              <Download className="w-6 h-6" />
            </button>
          )}

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Main image */}
          <div 
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {currentImage.previewPath || currentImage.thumbnailPath ? (
              <img
                src={currentImage.previewPath || currentImage.thumbnailPath || ''}
                alt={currentImage.title || 'Album image'}
                className="max-w-full max-h-[85vh] object-contain"
                onLoad={() => setLightboxLoading(false)}
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
          </div>

          {/* Image info */}
          {currentImage.title && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white text-center">
              <p className="text-lg font-medium">{currentImage.title}</p>
              <p className="text-white/60 text-sm">{currentImage.width} × {currentImage.height}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
