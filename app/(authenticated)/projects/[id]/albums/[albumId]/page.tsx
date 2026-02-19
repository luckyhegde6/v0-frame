'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Loader2, Settings, Upload, Image, 
  Film, Video, Play, FileImage, Palette, Eye, 
  Download, Trash2, Save, User, Check, Scissors, 
  Copy, GitBranch, X, Plus
} from 'lucide-react'
import { handleApiError, showSuccess } from '@/lib/error-handler'

interface Album {
  id: string
  name: string
  description: string | null
  category: string
  coverImage: string | null
}

interface AlbumSettings {
  id: string
  albumId: string
  imageQuality: string
  videoQuality: string
  shortQuality: string
  maxImageWidth: number
  maxImageHeight: number
  watermarkEnabled: boolean
  watermarkImage: string | null
  watermarkOpacity: number
  watermarkPosition: string
  faceRecognitionEnabled: boolean
  faceRecognitionStatus: string
  downloadEnabled: boolean
  bulkDownloadEnabled: boolean
}

const IMAGE_QUALITY_OPTIONS = [
  { value: 'LOW', label: 'Low (1920px)', description: 'Best for web viewing' },
  { value: 'MEDIUM', label: 'Medium (2560px)', description: 'Good balance' },
  { value: 'HIGH', label: 'High (4000px)', description: 'Print quality' },
  { value: 'ORIGINAL', label: 'Original', description: 'Keep original size' }
]

const VIDEO_QUALITY_OPTIONS = [
  { value: 'LOW', label: '720p', description: 'Standard quality' },
  { value: 'MEDIUM', label: '1080p', description: 'HD quality' },
  { value: 'HIGH', label: '4K', description: 'Ultra HD' }
]

const SHORT_QUALITY_OPTIONS = [
  { value: 'LOW', label: '720p', description: 'Standard quality' },
  { value: 'MEDIUM', label: '1080p', description: 'HD quality' },
  { value: 'HIGH', label: '1440p', description: 'High quality' }
]

const WATERMARK_POSITIONS = [
  { value: 'TOP_LEFT', label: 'Top Left' },
  { value: 'TOP_RIGHT', label: 'Top Right' },
  { value: 'BOTTOM_LEFT', label: 'Bottom Left' },
  { value: 'BOTTOM_RIGHT', label: 'Bottom Right' },
  { value: 'CENTER', label: 'Center' }
]

type TabType = 'content' | 'settings'

export default function AlbumDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const albumId = params.albumId as string
  
  const [album, setAlbum] = useState<Album | null>(null)
  const [settings, setSettings] = useState<AlbumSettings | null>(null)
  const [albumImages, setAlbumImages] = useState<{ id: string; title: string; thumbnailPath: string | null; previewPath: string | null; width: number; height: number; mimeType: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingImages, setLoadingImages] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('content')
  
  const [formData, setFormData] = useState({
    imageQuality: 'HIGH',
    videoQuality: 'HIGH',
    shortQuality: 'HIGH',
    maxImageWidth: 4000,
    maxImageHeight: 4000,
    watermarkEnabled: false,
    watermarkImage: '',
    watermarkOpacity: 0.5,
    watermarkPosition: 'BOTTOM_RIGHT',
    faceRecognitionEnabled: false,
    downloadEnabled: true,
    bulkDownloadEnabled: true
  })

  // Image management state
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [projectAlbums, setProjectAlbums] = useState<{ id: string; name: string; category: string }[]>([])
  const [operating, setOperating] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)
  
  // Modal states
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [albumSelectionMode, setAlbumSelectionMode] = useState<'existing' | 'new'>('existing')
  const [targetAlbumId, setTargetAlbumId] = useState('')
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumCategory, setNewAlbumCategory] = useState('PHOTO_ALBUM')
  const [newAlbumDescription, setNewAlbumDescription] = useState('')
  const [creatingAlbum, setCreatingAlbum] = useState(false)

  useEffect(() => {
    if (albumId) {
      fetchAlbum()
      fetchSettings()
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
        router.push(`/projects/${projectId}`)
      }
    } catch (error) {
      handleApiError(error, 'FetchAlbum')
    }
  }

  const fetchImages = async () => {
    setLoadingImages(true)
    try {
      const response = await fetch(`/api/albums/${albumId}/images`)
      if (response.ok) {
        const data = await response.json()
        setAlbumImages(data.images || [])
      }
    } catch (error) {
      console.error('Failed to fetch album images:', error)
    } finally {
      setLoadingImages(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}/settings`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        if (data.settings) {
          setFormData({
            imageQuality: data.settings.imageQuality || 'HIGH',
            videoQuality: data.settings.videoQuality || 'HIGH',
            shortQuality: data.settings.shortQuality || 'HIGH',
            maxImageWidth: data.settings.maxImageWidth || 4000,
            maxImageHeight: data.settings.maxImageHeight || 4000,
            watermarkEnabled: data.settings.watermarkEnabled || false,
            watermarkImage: data.settings.watermarkImage || '',
            watermarkOpacity: data.settings.watermarkOpacity || 0.5,
            watermarkPosition: data.settings.watermarkPosition || 'BOTTOM_RIGHT',
            faceRecognitionEnabled: data.settings.faceRecognitionEnabled || false,
            downloadEnabled: data.settings.downloadEnabled !== false,
            bulkDownloadEnabled: data.settings.bulkDownloadEnabled !== false
          })
        }
      }
    } catch (error) {
      handleApiError(error, 'FetchSettings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/albums/${albumId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showSuccess('Settings saved successfully!')
      }
    } catch (error) {
      handleApiError(error, 'SaveSettings')
    } finally {
      setSaving(false)
    }
  }

  const handleFaceRecognition = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}/settings/face-recognition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: formData.faceRecognitionEnabled })
      })

      if (response.ok) {
        showSuccess('Face recognition request submitted!')
      }
    } catch (error) {
      handleApiError(error, 'FaceRecognition')
    }
  }

  // Image management functions
  const fetchProjectAlbums = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/albums`)
      if (response.ok) {
        const data = await response.json()
        setProjectAlbums((data.albums || []).filter((a: any) => a.id !== albumId))
      }
    } catch (error) {
      console.error('Failed to fetch project albums:', error)
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
    if (selectedImages.length === albumImages.length) {
      setSelectedImages([])
    } else {
      setSelectedImages(albumImages.map(img => img.id))
    }
  }

  const handleRemoveFromAlbum = async () => {
    if (selectedImages.length === 0) return
    if (!confirm(`Remove ${selectedImages.length} image(s) from this album?`)) return

    try {
      const response = await fetch(`/api/albums/${albumId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: selectedImages })
      })

      if (response.ok) {
        showSuccess(`${selectedImages.length} image(s) removed from album`)
        setSelectedImages([])
        fetchImages()
      }
    } catch (error) {
      handleApiError(error, 'RemoveFromAlbum')
    }
  }

  const handleMove = async () => {
    setOperating(true)
    setResult(null)

    try {
      let finalTargetAlbumId = targetAlbumId

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
            projectId
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
        fetchImages()
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
            projectId
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
          targetAlbumId: finalTargetAlbumId
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
        fetchImages()
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
        fetchImages()
      }
    } catch (error) {
      handleApiError(error, 'CloneImages')
    } finally {
      setOperating(false)
    }
  }

  const openMoveModal = () => {
    fetchProjectAlbums()
    setShowMoveModal(true)
  }

  const openCopyModal = () => {
    fetchProjectAlbums()
    setShowCopyModal(true)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!album) return null

  const Icon = getCategoryIcon(album.category)

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/projects/${projectId}?tab=albums`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Albums
          </Link>
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
            <Link
              href={`/projects/${projectId}/upload?albumId=${albumId}`}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Link>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border mb-6">
          {(['content', 'settings'] as TabType[]).map((tab) => (
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

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Upload Quality Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Image Quality</label>
                  <div className="grid grid-cols-2 gap-3">
                    {IMAGE_QUALITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFormData(prev => ({ ...prev, imageQuality: opt.value }))}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          formData.imageQuality === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Video Quality</label>
                  <div className="grid grid-cols-3 gap-3">
                    {VIDEO_QUALITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFormData(prev => ({ ...prev, videoQuality: opt.value }))}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          formData.videoQuality === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Shorts/Reels Quality</label>
                  <div className="grid grid-cols-3 gap-3">
                    {SHORT_QUALITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFormData(prev => ({ ...prev, shortQuality: opt.value }))}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          formData.shortQuality === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Watermark Settings
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Enable Watermark</div>
                    <div className="text-sm text-muted-foreground">Add watermark to images</div>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, watermarkEnabled: !prev.watermarkEnabled }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      formData.watermarkEnabled ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.watermarkEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {formData.watermarkEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Watermark Image URL</label>
                      <input
                        type="url"
                        value={formData.watermarkImage}
                        onChange={(e) => setFormData(prev => ({ ...prev, watermarkImage: e.target.value }))}
                        placeholder="https://example.com/watermark.png"
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Position</label>
                      <select
                        value={formData.watermarkPosition}
                        onChange={(e) => setFormData(prev => ({ ...prev, watermarkPosition: e.target.value }))}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg"
                      >
                        {WATERMARK_POSITIONS.map((pos) => (
                          <option key={pos.value} value={pos.value}>{pos.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Opacity: {Math.round(formData.watermarkOpacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.watermarkOpacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, watermarkOpacity: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Features
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Face Recognition</div>
                    <div className="text-sm text-muted-foreground">Enable AI face detection (creates admin task)</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        faceRecognitionEnabled: !prev.faceRecognitionEnabled 
                      }))}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        formData.faceRecognitionEnabled ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        formData.faceRecognitionEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                    {formData.faceRecognitionEnabled && (
                      <button
                        onClick={handleFaceRecognition}
                        className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                      >
                        Request
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Download Images</div>
                    <div className="text-sm text-muted-foreground">Allow clients to download individual images</div>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, downloadEnabled: !prev.downloadEnabled }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      formData.downloadEnabled ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.downloadEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Bulk Download</div>
                    <div className="text-sm text-muted-foreground">Allow clients to download all images as ZIP</div>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, bulkDownloadEnabled: !prev.bulkDownloadEnabled }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      formData.bulkDownloadEnabled ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.bulkDownloadEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Settings
              </button>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            {/* Image Management Toolbar */}
            {albumImages.length > 0 && (
              <div className="mb-6 space-y-4">
                {/* Selection Bar */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedImages.length === albumImages.length && albumImages.length > 0}
                      onChange={selectAllImages}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm font-medium">
                      {selectedImages.length > 0 
                        ? `${selectedImages.length} selected` 
                        : 'Select all'}
                    </span>
                  </div>
                  
                  {selectedImages.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={openMoveModal}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                      >
                        <Scissors className="w-4 h-4" />
                        Move
                      </button>
                      <button
                        onClick={openCopyModal}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                      <button
                        onClick={handleClone}
                        disabled={operating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                      >
                        {operating ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                        Clone
                      </button>
                      <button
                        onClick={handleRemoveFromAlbum}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {loadingImages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : albumImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {albumImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-all ${
                      selectedImages.includes(image.id) ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => toggleImageSelection(image.id)}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image.id)}
                        onChange={() => toggleImageSelection(image.id)}
                        className="w-4 h-4 rounded border-border"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {image.thumbnailPath || image.previewPath ? (
                      <img
                        src={image.previewPath || image.thumbnailPath || ''}
                        alt={image.title || 'Album image'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-xs text-white truncate">{image.title || 'Untitled'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No images in this album yet</p>
                <Link
                  href={`/projects/${projectId}/upload?albumId=${albumId}`}
                  className="text-primary hover:underline mt-2 inline-block"
                >
                  Upload images
                </Link>
              </div>
            )}
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
                  Move {selectedImages.length} image(s) to another album in this project.
                </p>

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
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    >
                      <option value="">Select album...</option>
                      {projectAlbums.map(album => (
                        <option key={album.id} value={album.id}>
                          {album.name}
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
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Category</label>
                      <select
                        value={newAlbumCategory}
                        onChange={(e) => setNewAlbumCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      >
                        <option value="PHOTO_ALBUM">Photo Album</option>
                        <option value="COVER_PAGE">Cover Page</option>
                        <option value="SHORT_VIDEOS">Short Videos</option>
                        <option value="REELS">Reels</option>
                        <option value="SHORTS">Shorts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Description</label>
                      <textarea
                        value={newAlbumDescription}
                        onChange={(e) => setNewAlbumDescription(e.target.value)}
                        placeholder="Enter description..."
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={closeModals}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMove}
                    disabled={operating || creatingAlbum || (albumSelectionMode === 'existing' ? !targetAlbumId : !newAlbumName.trim())}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
                  >
                    {operating || creatingAlbum ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                    {creatingAlbum ? 'Creating...' : 'Move'}
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
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    >
                      <option value="">Select album...</option>
                      {projectAlbums.map(album => (
                        <option key={album.id} value={album.id}>
                          {album.name}
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
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Category</label>
                      <select
                        value={newAlbumCategory}
                        onChange={(e) => setNewAlbumCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                      >
                        <option value="PHOTO_ALBUM">Photo Album</option>
                        <option value="COVER_PAGE">Cover Page</option>
                        <option value="SHORT_VIDEOS">Short Videos</option>
                        <option value="REELS">Reels</option>
                        <option value="SHORTS">Shorts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Description</label>
                      <textarea
                        value={newAlbumDescription}
                        onChange={(e) => setNewAlbumDescription(e.target.value)}
                        placeholder="Enter description..."
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={closeModals}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={operating || creatingAlbum || (albumSelectionMode === 'existing' ? !targetAlbumId : !newAlbumName.trim())}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
                  >
                    {operating || creatingAlbum ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                    {creatingAlbum ? 'Creating...' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
