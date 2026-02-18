'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Loader2, Settings, Upload, Image, 
  Film, Video, Play, FileImage, Palette, Eye, 
  Download, Trash2, Save, User, Check
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
            {loadingImages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : albumImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {albumImages.map((image) => (
                  <div
                    key={image.id}
                    className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  >
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
      </main>
    </div>
  )
}
