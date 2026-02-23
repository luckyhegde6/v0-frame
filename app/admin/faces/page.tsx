'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Filter,
  Image as ImageIcon,
  Loader2,
  Edit,
  Trash2,
  UserCheck
} from 'lucide-react'
import { handleApiError } from '@/lib/error-handler'

interface FaceGroup {
  id: string
  label: string | null
  suggestedName: string | null
  faceCount: number
  albumId: string | null
  album?: {
    name: string
  } | null
  createdAt: string
  faces: {
    id: string
    image: {
      id: string
      thumbnailPath: string | null
    } | null
  }[]
}

export default function FacesPage() {
  const [faceGroups, setFaceGroups] = useState<FaceGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchFaceGroups()
  }, [filter])

  const fetchFaceGroups = async () => {
    try {
      const url = filter !== 'all' 
        ? `/api/admin/faces?filter=${filter}` 
        : '/api/admin/faces'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setFaceGroups(data.faceGroups || [])
      }
    } catch (error) {
      handleApiError(error, 'FetchFaceGroups')
    } finally {
      setLoading(false)
    }
  }

  const filteredGroups = faceGroups.filter(group => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      group.label?.toLowerCase().includes(query) ||
      group.suggestedName?.toLowerCase().includes(query) ||
      group.album?.name?.toLowerCase().includes(query)
    )
  })

  const unlabelledCount = faceGroups.filter(g => !g.label).length
  const labelledCount = faceGroups.filter(g => g.label).length

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </Link>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6" />
                Face Management
              </h1>
              <p className="text-muted-foreground">
                Manage detected faces and group similar faces together
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search faces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Faces ({faceGroups.length})</option>
                <option value="labelled">Labelled ({labelledCount})</option>
                <option value="unlabelled">Unlabelled ({unlabelledCount})</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Face Groups Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Run face detection on images to detect faces'
              }
            </p>
            <Link
              href="/admin/tasks/DETECT_FACES"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <UserCheck className="w-4 h-4" />
              Run Face Detection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredGroups.map(group => (
              <Link
                key={group.id}
                href={`/admin/faces/${group.id}`}
                className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
              >
                <div className="aspect-square relative bg-muted">
                  {group.faces[0]?.image?.thumbnailPath ? (
                    <img 
                      src={group.faces[0].image.thumbnailPath}
                      alt={group.label || 'Face'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded-full text-xs text-white">
                    {group.faceCount} faces
                  </div>
                </div>
                
                <div className="p-3">
                  <h3 className="font-medium truncate">
                    {group.label || group.suggestedName || 'Unnamed'}
                  </h3>
                  {group.album && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {group.album.name}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
