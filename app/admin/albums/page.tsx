'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FolderOpen, Image, Loader2, Search, Eye, Trash2, Settings, Users } from 'lucide-react'
import { handleApiError, showSuccess } from '@/lib/error-handler'

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
  imageCount: number
  coverImage: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminAlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleDeleteAlbum = async (albumId: string, albumName: string) => {
    if (!confirm(`Are you sure you want to delete "${albumName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess('Album deleted successfully')
        fetchAlbums()
      }
    } catch (error) {
      handleApiError(error, 'DeleteAlbum')
    }
  }

  const filteredAlbums = albums.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-green-500" />
              Album Management
            </h1>
            <p className="text-muted-foreground">Manage all albums across projects</p>
          </div>
          <button
            onClick={fetchAlbums}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Loader2 className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search albums by name, owner, project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No albums found</p>
        </div>
      ) : (
        <div className="px-6 pb-8">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-sm font-medium">Album</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Project</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Owner</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Images</th>
                  <th className="text-left px-4 py-3 text-sm font-medium">Created</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlbums.map(album => (
                  <tr key={album.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          {album.coverImage ? (
                            <img src={album.coverImage} alt="" className="w-full h-full object-cover rounded" />
                          ) : (
                            <FolderOpen className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{album.name}</p>
                          {album.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">{album.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-muted rounded text-xs capitalize">
                        {getCategoryLabel(album.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {album.projectId ? (
                        <Link
                          href={`/projects/${album.projectId}`}
                          className="text-primary hover:underline"
                        >
                          {album.projectName || 'Unknown Project'}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{album.ownerName || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{album.ownerEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Image className="w-4 h-4 text-muted-foreground" />
                        {album.imageCount}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(album.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {album.projectId && (
                          <Link
                            href={`/projects/${album.projectId}/albums/${album.id}`}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="View Album"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleDeleteAlbum(album.id, album.name)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Delete Album"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
