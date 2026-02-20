'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Layers, Plus, MoreVertical, Pencil, Trash2, Share2, Image, Loader2, ArrowLeft, Search, FolderOpen, Film, FileImage, Video, Play } from 'lucide-react'
import { handleApiError, showSuccess } from '@/lib/error-handler'

type AlbumCategory = 'PHOTO_ALBUM' | 'COVER_PAGE' | 'SHORT_VIDEOS' | 'REELS' | 'SHORTS'

interface Album {
  id: string
  name: string
  description: string | null
  category: AlbumCategory
  imageCount: number
  coverImage: string | null
  createdAt: string
  updatedAt: string
}

const CATEGORIES: { value: AlbumCategory; label: string; icon: React.ElementType }[] = [
  { value: 'PHOTO_ALBUM', label: 'Photo Album', icon: FileImage },
  { value: 'COVER_PAGE', label: 'Cover Page', icon: Image },
  { value: 'SHORT_VIDEOS', label: 'Short Videos', icon: Film },
  { value: 'REELS', label: 'Reels', icon: Play },
  { value: 'SHORTS', label: 'Shorts', icon: Video },
]

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumDesc, setNewAlbumDesc] = useState('')
  const [newAlbumCategory, setNewAlbumCategory] = useState<AlbumCategory>('PHOTO_ALBUM')
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<AlbumCategory | 'all'>('all')

  useEffect(() => {
    fetchAlbums()
  }, [])

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/albums')
      if (response.ok) {
        const data = await response.json()
        setAlbums(data.albums || [])
      }
    } catch (error) {
      handleApiError(error, 'FetchAlbums')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAlbumName,
          description: newAlbumDesc,
          category: newAlbumCategory
        })
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewAlbumName('')
        setNewAlbumDesc('')
        setNewAlbumCategory('PHOTO_ALBUM')
        fetchAlbums()
        showSuccess('Album created successfully')
      }
    } catch (error) {
      handleApiError(error, 'CreateAlbum')
    } finally {
      setCreating(false)
    }
  }

  const filteredAlbums = albums.filter(album => {
    const matchesSearch = album.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || album.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryInfo = (category: AlbumCategory) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0]
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Controls */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between sticky top-16 z-30 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Album
          </button>
        </div>
      </div>

      {/* Page Title */}
      <div className="border-b border-border px-6 py-4 bg-muted/50">
        <h1 className="text-2xl font-bold">Albums</h1>
        <p className="text-muted-foreground">Organize your media into albums</p>
      </div>

      {/* Filters */}
      <div className="px-6 py-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterCategory === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    filterCategory === cat.value 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Albums Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No albums found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-primary hover:underline"
          >
            Create your first album
          </button>
        </div>
      ) : (
        <div className="px-6 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAlbums.map(album => {
              const CategoryIcon = getCategoryInfo(album.category).icon
              return (
                <div
                  key={album.id}
                  className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {album.coverImage ? (
                      <img src={album.coverImage} alt={album.name} className="w-full h-full object-cover" />
                    ) : (
                      <CategoryIcon className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{album.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {album.imageCount} items
                        </p>
                      </div>
                      <button className="p-1 hover:bg-muted rounded">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                        {getCategoryInfo(album.category).label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create New Album</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Album Name</label>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="My Album"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newAlbumDesc}
                  onChange={(e) => setNewAlbumDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={newAlbumCategory}
                  onChange={(e) => setNewAlbumCategory(e.target.value as AlbumCategory)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newAlbumName}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
