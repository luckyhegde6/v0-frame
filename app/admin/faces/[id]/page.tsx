'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Users, 
  Loader2,
  Edit,
  Trash2,
  Save,
  X,
  Image as ImageIcon
} from 'lucide-react'
import { handleApiError, showSuccess } from '@/lib/error-handler'

interface FaceGroupDetail {
  id: string
  label: string | null
  suggestedName: string | null
  faceCount: number
  albumId: string | null
  album?: {
    id: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
  faces: {
    id: string
    x: number
    y: number
    width: number
    height: number
    confidence: number
    image: {
      id: string
      title: string | null
      thumbnailPath: string | null
    }
  }[]
}

export default function FaceGroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<FaceGroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingLabel, setEditingLabel] = useState(false)
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchFaceGroup()
  }, [groupId])

  const fetchFaceGroup = async () => {
    try {
      const response = await fetch(`/api/admin/faces/${groupId}`)
      if (response.ok) {
        const data = await response.json()
        setGroup(data.faceGroup)
        setLabel(data.faceGroup.label || '')
      }
    } catch (error) {
      handleApiError(error, 'FetchFaceGroup')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLabel = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/faces/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      })

      if (response.ok) {
        showSuccess('Label updated successfully')
        setEditingLabel(false)
        fetchFaceGroup()
      }
    } catch (error) {
      handleApiError(error, 'UpdateLabel')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this face group? This will not delete the detected faces.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/faces/${groupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/admin/faces')
      }
    } catch (error) {
      handleApiError(error, 'DeleteFaceGroup')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Face Group Not Found</h3>
          <Link href="/admin/faces" className="text-primary hover:underline">
            Back to Faces
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/faces"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Faces
            </Link>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                {group.faces[0]?.image?.thumbnailPath ? (
                  <img 
                    src={group.faces[0].image.thumbnailPath || ''}
                    alt="Cover"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Users className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              
              <div>
                {editingLabel ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="px-3 py-1 bg-muted border border-border rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter name..."
                      autoFocus
                    />
                    <button
                      onClick={handleSaveLabel}
                      disabled={saving}
                      className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingLabel(false)
                        setLabel(group.label || '')
                      }}
                      className="p-1.5 bg-muted border border-border rounded-lg hover:bg-muted/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">
                      {group.label || group.suggestedName || 'Unnamed Face Group'}
                    </h1>
                    <button
                      onClick={() => setEditingLabel(true)}
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <p className="text-muted-foreground">
                  {group.faceCount} faces • {group.album?.name || 'No album'}
                </p>
              </div>
            </div>

            <button
              onClick={handleDeleteGroup}
              className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Group
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold mb-4">Faces in this Group ({group.faces.length})</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {group.faces.map(face => (
            <div
              key={face.id}
              className="group relative aspect-square bg-muted rounded-lg overflow-hidden"
            >
              {face.image.thumbnailPath ? (
                <img 
                  src={face.image.thumbnailPath}
                  alt={face.image.title || 'Face'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Link
                  href={`/admin/gallery?image=${face.image.id}`}
                  className="px-3 py-1.5 bg-white text-black rounded-lg text-sm font-medium"
                >
                  View
                </Link>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 text-white text-xs">
                {(face.confidence * 100).toFixed(0)}% confidence
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
