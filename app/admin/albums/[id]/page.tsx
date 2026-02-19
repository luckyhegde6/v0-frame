'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FolderOpen, 
  Image as ImageIcon, 
  ArrowLeft, 
  RefreshCw, 
  Loader2, 
  Trash2, 
  X,
  Layers,
  User,
  Calendar,
  ChevronRight,
  Search,
  Check,
  Scissors,
  Copy,
  GitBranch,
  Edit2,
  Eye
} from 'lucide-react'
import { handleApiError, showSuccess } from '@/lib/error-handler'
import { ImageCard } from '@/components/image-card'

interface AlbumImage {
  id: string
  title: string
  thumbnailPath: string | null
  previewPath: string | null
  width: number
  height: number
  mimeType: string
  sizeBytes: number
  createdAt: string
  addedAt: string
}

interface Album {
  id: string
  name: string
  description: string | null
  category: string
  projectId: string | null
  projectName: string | null
  ownerId: string
  ownerName: string
  ownerEmail: string
  coverImage: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminAlbumDetailPage() {
  const params = useParams()
  const router = useRouter()
  const albumId = params.id as string
  
  const [album, setAlbum] = useState<Album | null>(null)
  const [images, setImages] = useState<AlbumImage[]>([])
  const [allAlbums, setAllAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [operating, setOperating] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)
  
  // Modal states
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [targetAlbumId, setTargetAlbumId] = useState('')
  const [albumSelectionMode, setAlbumSelectionMode] = useState<'existing' | 'new'>('existing')
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumCategory, setNewAlbumCategory] = useState('PHOTO_ALBUM')
  const [newAlbumDescription, setNewAlbumDescription] = useState('')
  const [creatingAlbum, setCreatingAlbum] = useState(false)
  
  // Owner management state
  const [users, setUsers] = useState<{id: string, name: string | null, email: string}[]>([])
  const [showOwnerModal, setShowOwnerModal] = useState(false)
  const [selectedOwnerId, setSelectedOwnerId] = useState('')
  const [updatingOwner, setUpdatingOwner] = useState(false)
  
  // Image viewer state
  const [viewingImage, setViewingImage] = useState<AlbumImage | null>(null)

  const fetchAlbumData = async () => {
    try {
      const [albumRes, imagesRes, albumsRes] = await Promise.all([
        fetch(`/api/albums/${albumId}`),
        fetch(`/api/albums/${albumId}/images`),
        fetch('/api/albums')
      ])

      if (albumRes.ok) {
        const albumData = await albumRes.json()
        setAlbum(albumData.album)
      }

      if (imagesRes.ok) {
        const imagesData = await imagesRes.json()
        setImages(imagesData.images || [])
      }

      if (albumsRes.ok) {
        const albumsData = await albumsRes.json()
        setAllAlbums((albumsData.albums || []).filter((a: Album) => a.id !== albumId))
      }
    } catch (error) {
      handleApiError(error, 'FetchAlbumData')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAlbumData()
  }, [albumId])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAlbumData()
  }

  const handleRemoveFromAlbum = async () => {
    if (selectedImages.length === 0) return
    if (!confirm(`Remove ${selectedImages.length} image(s) from this album? The images will not be deleted from the system.`)) {
      return
    }

    try {
      const response = await fetch(`/api/albums/${albumId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: selectedImages })
      })

      if (response.ok) {
        showSuccess(`${selectedImages.length} image(s) removed from album`)
        setSelectedImages([])
        fetchAlbumData()
      }
    } catch (error) {
      handleApiError(error, 'RemoveFromAlbum')
    }
  }

  const handleDeleteImages = async () => {
    if (selectedImages.length === 0) return
    if (!confirm(`Are you sure you want to permanently delete ${selectedImages.length} image(s)? This action cannot be undone.`)) {
      return
    }

    setOperating(true)
    try {
      const response = await fetch('/api/admin/gallery/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          imageIds: selectedImages
        })
      })

      const data = await response.json()
      if (data.success > 0) {
        showSuccess(`${data.success} image(s) deleted successfully`)
        setSelectedImages([])
        fetchAlbumData()
      }
      if (data.failed > 0) {
        alert(`Failed to delete ${data.failed} image(s)`)
      }
    } catch (error) {
      handleApiError(error, 'DeleteImages')
    } finally {
      setOperating(false)
    }
  }

  const handleMove = async () => {
    setOperating(true)
    setResult(null)

    try {
      let finalTargetAlbumId = targetAlbumId

      // Create new album if selected
      if (albumSelectionMode === 'new') {
        if (!newAlbumName.trim()) {
          alert('Please enter an album name')
          setOperating(false)
          return
        }

        setCreatingAlbum(true)
        const createResponse = await fetch('/api/albums', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newAlbumName.trim(),
            category: newAlbumCategory,
            description: newAlbumDescription.trim() || undefined,
            projectId: album?.projectId
          })
        })

        if (!createResponse.ok) {
          const errorData = await createResponse.json()
          alert(errorData.error || 'Failed to create album')
          setOperating(false)
          setCreatingAlbum(false)
          return
        }

        const newAlbum = await createResponse.json()
        finalTargetAlbumId = newAlbum.album.id
        setCreatingAlbum(false)
      }

      if (!finalTargetAlbumId) {
        alert('Please select or create a target album')
        setOperating(false)
        return
      }

      const response = await fetch(`/api/albums/${albumId}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          imageIds: selectedImages,
          targetAlbumId: finalTargetAlbumId
        })
      })

      const data = await response.json()
      setResult(data)

      if (data.success > 0) {
        showSuccess(`${data.success} image(s) moved successfully`)
        setSelectedImages([])
        setShowMoveModal(false)
        setTargetAlbumId('')
        setNewAlbumName('')
        setNewAlbumDescription('')
        setAlbumSelectionMode('existing')
        fetchAlbumData()
      }
    } catch (error) {
      handleApiError(error, 'MoveImages')
    } finally {
      setOperating(false)
    }
  }

  const handleCopy = async () => {
    setOperating(true)
    setResult(null)

    try {
      let finalTargetAlbumId = targetAlbumId

      // Create new album if selected
      if (albumSelectionMode === 'new') {
        if (!newAlbumName.trim()) {
          alert('Please enter an album name')
          setOperating(false)
          return
        }

        setCreatingAlbum(true)
        const createResponse = await fetch('/api/albums', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newAlbumName.trim(),
            category: newAlbumCategory,
            description: newAlbumDescription.trim() || undefined,
            projectId: album?.projectId
          })
        })

        if (!createResponse.ok) {
          const errorData = await createResponse.json()
          alert(errorData.error || 'Failed to create album')
          setOperating(false)
          setCreatingAlbum(false)
          return
        }

        const newAlbum = await createResponse.json()
        finalTargetAlbumId = newAlbum.album.id
        setCreatingAlbum(false)
      }

      if (!finalTargetAlbumId) {
        alert('Please select or create a target album')
        setOperating(false)
        return
      }

      const response = await fetch(`/api/albums/${albumId}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copy',
          imageIds: selectedImages,
          targetAlbumId
        })
      })

      const data = await response.json()
      setResult(data)

      if (data.success > 0) {
        showSuccess(`${data.success} image(s) copied successfully`)
        setSelectedImages([])
        setShowCopyModal(false)
        setTargetAlbumId('')
        setNewAlbumName('')
        setNewAlbumDescription('')
        setAlbumSelectionMode('existing')
        fetchAlbumData()
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
      const response = await fetch(`/api/albums/${albumId}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clone',
          imageIds: selectedImages
        })
      })

      const data = await response.json()
      setResult(data)

      if (data.success > 0) {
        showSuccess(`${data.success} image(s) cloned successfully`)
        setSelectedImages([])
        fetchAlbumData()
      }
    } catch (error) {
      handleApiError(error, 'CloneImages')
    } finally {
      setOperating(false)
    }
  }

  const closeModals = () => {
    setShowMoveModal(false)
    setShowCopyModal(false)
    setTargetAlbumId('')
    setResult(null)
    setAlbumSelectionMode('existing')
    setNewAlbumName('')
    setNewAlbumDescription('')
    setNewAlbumCategory('PHOTO_ALBUM')
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=100')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleUpdateOwner = async () => {
    if (!selectedOwnerId) return
    
    setUpdatingOwner(true)
    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: selectedOwnerId })
      })

      if (response.ok) {
        showSuccess('Album owner updated successfully')
        setShowOwnerModal(false)
        setSelectedOwnerId('')
        fetchAlbumData()
      }
    } catch (error) {
      handleApiError(error, 'UpdateOwner')
    } finally {
      setUpdatingOwner(false)
    }
  }

  const openOwnerModal = () => {
    fetchUsers()
    setSelectedOwnerId(album?.ownerId || '')
    setShowOwnerModal(true)
  }

  const toggleImageSelection = (imageId: string) => {
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ')
  }

  const filteredImages = images.filter(img =>
    img.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Album not found</h2>
        <Link href="/admin/albums" className="text-primary hover:underline">
          Back to Albums
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link
            href="/admin/albums"
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Albums
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{album.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Layers className="w-7 h-7 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {album.name}
                <span className="px-2 py-0.5 bg-muted rounded text-sm font-normal">
                  {getCategoryLabel(album.category)}
                </span>
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {album.ownerName || album.ownerEmail}
                </span>
                {album.projectName && (
                  <Link
                    href={`/projects/${album.projectId}`}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                    {album.projectName}
                  </Link>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(album.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openOwnerModal}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Change Owner
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>
        </div>

        {/* Description */}
        {album.description && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{album.description}</p>
          </div>
        )}

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
              <Check className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{selectedImages.length}</p>
                <p className="text-sm text-muted-foreground">Selected</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {images.reduce((acc, img) => acc + img.sizeBytes, 0) / 1024 / 1024 | 0}
                </p>
                <p className="text-sm text-muted-foreground">MB Total Size</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedImages.length > 0 && (
              <>
                <button
                  onClick={() => setShowMoveModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
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
                  {operating ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                  Clone
                </button>
                <button
                  onClick={handleDeleteImages}
                  disabled={operating}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={handleRemoveFromAlbum}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  Remove ({selectedImages.length})
                </button>
              </>
            )}
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'} transition-colors`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'} transition-colors`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Selection Bar */}
        {filteredImages.length > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <input
              type="checkbox"
              checked={selectedImages.length === filteredImages.length && filteredImages.length > 0}
              onChange={selectAll}
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm font-medium">
              Select All ({filteredImages.length} images)
            </span>
            {selectedImages.length > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                ({selectedImages.length} selected)
              </span>
            )}
          </div>
        )}

        {/* Images Display */}
        {filteredImages.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-lg">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No images match your search' : 'No images in this album yet'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className={`group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedImages.includes(image.id) ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/50'
                }`}
              >
                {/* Click to view image */}
                <div 
                  className="w-full h-full"
                  onClick={() => setViewingImage(image)}
                >
                  {image.thumbnailPath ? (
                    <img
                      src={image.thumbnailPath}
                      alt={image.title || 'Image'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Selection checkbox */}
                <div 
                  className="absolute top-2 left-2 z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleImageSelection(image.id)
                  }}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedImages.includes(image.id) 
                      ? 'bg-primary border-primary' 
                      : 'border-white/70 bg-black/30 hover:bg-black/50'
                  }`}>
                    {selectedImages.includes(image.id) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>

                {/* View button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setViewingImage(image)
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Image info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{image.title || 'Untitled'}</p>
                  <p className="text-xs text-white/70">{image.width}x{image.height}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Image</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Dimensions</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Size</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Added</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredImages.map((image) => (
                  <tr key={image.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image.id)}
                        onChange={() => toggleImageSelection(image.id)}
                        className="w-4 h-4 rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                          {image.thumbnailPath ? (
                            <img src={image.thumbnailPath} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{image.title || 'Untitled'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {image.width} x {image.height}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatBytes(image.sizeBytes)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(image.addedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedImages([image.id])
                          handleRemoveFromAlbum()
                        }}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Remove from album"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Move Modal */}
        {showMoveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeModals} />
            <div className="relative bg-card border border-border rounded-lg w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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
                <p className="text-sm text-muted-foreground">
                  Move {selectedImages.length} image(s) to another album. This will remove them from the current album.
                </p>

                {/* Selection Mode Radio Buttons */}
                <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="existing"
                      checked={albumSelectionMode === 'existing'}
                      onChange={(e) => setAlbumSelectionMode(e.target.value as 'existing' | 'new')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Existing Album</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="new"
                      checked={albumSelectionMode === 'new'}
                      onChange={(e) => setAlbumSelectionMode(e.target.value as 'existing' | 'new')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Create New Album</span>
                  </label>
                </div>

                {albumSelectionMode === 'existing' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Album</label>
                    <select
                      value={targetAlbumId}
                      onChange={(e) => setTargetAlbumId(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select album...</option>
                      {allAlbums.map(album => (
                        <option key={album.id} value={album.id}>
                          {album.name} {album.projectName ? `(in ${album.projectName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <h3 className="text-sm font-medium">New Album Details</h3>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Album Name *</label>
                      <input
                        type="text"
                        value={newAlbumName}
                        onChange={(e) => setNewAlbumName(e.target.value)}
                        placeholder="Enter album name..."
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Category</label>
                      <select
                        value={newAlbumCategory}
                        onChange={(e) => setNewAlbumCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="PHOTO_ALBUM">Photo Album</option>
                        <option value="COVER_PAGE">Cover Page</option>
                        <option value="SHORT_VIDEOS">Short Videos</option>
                        <option value="REELS">Reels</option>
                        <option value="SHORTS">Shorts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Description (Optional)</label>
                      <textarea
                        value={newAlbumDescription}
                        onChange={(e) => setNewAlbumDescription(e.target.value)}
                        placeholder="Enter album description..."
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>
                )}

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
                    disabled={operating || creatingAlbum || (albumSelectionMode === 'existing' ? !targetAlbumId : !newAlbumName.trim())}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {operating || creatingAlbum ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                    {creatingAlbum ? 'Creating Album...' : 'Move'}
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
            <div className="relative bg-card border border-border rounded-lg w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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
                <p className="text-sm text-muted-foreground">
                  Copy {selectedImages.length} image(s) to another album. Images will exist in both albums.
                </p>

                {/* Selection Mode Radio Buttons */}
                <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="existing"
                      checked={albumSelectionMode === 'existing'}
                      onChange={(e) => setAlbumSelectionMode(e.target.value as 'existing' | 'new')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Existing Album</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="new"
                      checked={albumSelectionMode === 'new'}
                      onChange={(e) => setAlbumSelectionMode(e.target.value as 'existing' | 'new')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Create New Album</span>
                  </label>
                </div>

                {albumSelectionMode === 'existing' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Album</label>
                    <select
                      value={targetAlbumId}
                      onChange={(e) => setTargetAlbumId(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select album...</option>
                      {allAlbums.map(album => (
                        <option key={album.id} value={album.id}>
                          {album.name} {album.projectName ? `(in ${album.projectName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <h3 className="text-sm font-medium">New Album Details</h3>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Album Name *</label>
                      <input
                        type="text"
                        value={newAlbumName}
                        onChange={(e) => setNewAlbumName(e.target.value)}
                        placeholder="Enter album name..."
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Category</label>
                      <select
                        value={newAlbumCategory}
                        onChange={(e) => setNewAlbumCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="PHOTO_ALBUM">Photo Album</option>
                        <option value="COVER_PAGE">Cover Page</option>
                        <option value="SHORT_VIDEOS">Short Videos</option>
                        <option value="REELS">Reels</option>
                        <option value="SHORTS">Shorts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Description (Optional)</label>
                      <textarea
                        value={newAlbumDescription}
                        onChange={(e) => setNewAlbumDescription(e.target.value)}
                        placeholder="Enter album description..."
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>
                )}

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
                    disabled={operating || creatingAlbum || (albumSelectionMode === 'existing' ? !targetAlbumId : !newAlbumName.trim())}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {operating || creatingAlbum ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                    {creatingAlbum ? 'Creating Album...' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Owner Management Modal */}
        {showOwnerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowOwnerModal(false)} />
            <div className="relative bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Change Album Owner
                </h2>
                <button onClick={() => setShowOwnerModal(false)} className="p-2 hover:bg-muted rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Current owner: <span className="font-medium text-foreground">{album.ownerName || album.ownerEmail}</span>
                </p>
                
                <div>
                  <label className="block text-sm font-medium mb-1">New Owner</label>
                  <select
                    value={selectedOwnerId}
                    onChange={(e) => setSelectedOwnerId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select user...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => setShowOwnerModal(false)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateOwner}
                    disabled={updatingOwner || !selectedOwnerId || selectedOwnerId === album.ownerId}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {updatingOwner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Update Owner
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Viewer Modal */}
        {viewingImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setViewingImage(null)}>
            <div className="relative max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setViewingImage(null)}
                className="absolute -top-10 right-0 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              {viewingImage.previewPath || viewingImage.thumbnailPath ? (
                <img
                  src={viewingImage.previewPath || viewingImage.thumbnailPath || ''}
                  alt={viewingImage.title || 'Album image'}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
              ) : (
                <div className="w-[600px] h-[400px] bg-muted rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              
              <div className="mt-4 text-center text-white">
                <p className="font-medium">{viewingImage.title || 'Untitled'}</p>
                <p className="text-sm text-white/70">
                  {viewingImage.width} x {viewingImage.height} • {formatBytes(viewingImage.sizeBytes)}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
