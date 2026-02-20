'use client'

import { useEffect, useState } from 'react'
import { 
  FolderOpen, 
  Image as ImageIcon, 
  Layers, 
  Users, 
  ArrowLeft, 
  RefreshCw, 
  Loader2,
  ChevronRight,
  Search,
  Grid,
  List
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { handleApiError } from '@/lib/error-handler'

interface GalleryImage {
  id: string
  title: string
  userId: string
  userEmail: string
  width: number
  height: number
  sizeBytes: number
  status: string
  thumbnailPath: string | null
  previewPath: string | null
  createdAt: string
}

interface Collection {
  id: string
  name: string
  userId: string
  userEmail: string
  imageCount: number
}

interface Project {
  id: string
  name: string
  ownerId: string
  ownerEmail: string
  imageCount: number
  storageUsed: number
  quotaBytes: number
}

interface User {
  id: string
  name: string | null
  email: string
  imageCount: number
}

export default function AdminUserGalleryPage() {
  const params = useParams()
  const userId = params.userId as string
  
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'images' | 'collections' | 'projects'>('images')

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    try {
      const [usersRes, galleryRes] = await Promise.all([
        fetch('/api/admin/users'),
        userId ? fetch(`/api/admin/gallery?userId=${userId}`) : fetch('/api/admin/gallery')
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
        
        if (userId) {
          const selected = usersData.users?.find((u: User) => u.id === userId)
          setSelectedUser(selected || null)
        }
      }

      if (galleryRes.ok) {
        const galleryData = await galleryRes.json()
        setImages(galleryData.images || [])
        setCollections(galleryData.collections || [])
        setProjects(galleryData.projects || [])
      }
    } catch (error) {
      handleApiError(error, 'FetchGalleryData')
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredImages = images.filter(img => 
    img.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link
            href="/admin"
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Admin
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <Link
            href="/admin/gallery"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Gallery
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground font-medium">{selectedUser?.email || 'Loading...'}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {selectedUser ? `${selectedUser.name || selectedUser.email}'s Gallery` : 'Gallery'}
              </h1>
              <p className="text-muted-foreground">
                {images.length} images, {collections.length} collections, {projects.length} projects
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Storage Overview */}
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
              <Layers className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{collections.length}</p>
                <p className="text-sm text-muted-foreground">Collections</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('images')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'images' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Images ({images.length})
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'collections' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Collections ({collections.length})
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'projects' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Projects ({projects.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Images Content */}
        {activeTab === 'images' && (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' 
            : 'space-y-2'
          }>
            {filteredImages.map(image => (
              viewMode === 'grid' ? (
                <div 
                  key={image.id} 
                  className="group relative aspect-square bg-muted rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-xs font-medium truncate">{image.title || 'Untitled'}</p>
                      <p className="text-white/70 text-xs">{formatBytes(image.sizeBytes)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  key={image.id}
                  className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {image.thumbnailPath ? (
                      <img src={image.thumbnailPath} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{image.title || 'Untitled'}</p>
                    <p className="text-sm text-muted-foreground">{image.width}x{image.height}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{formatBytes(image.sizeBytes)}</p>
                    <p className={`text-xs ${
                      image.status === 'STORED' ? 'text-green-500' :
                      image.status === 'PROCESSING' ? 'text-yellow-500' :
                      'text-muted-foreground'
                    }`}>{image.status}</p>
                  </div>
                </div>
              )
            ))}
            {filteredImages.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No images found
              </div>
            )}
          </div>
        )}

        {/* Collections Content */}
        {activeTab === 'collections' && (
          <div className="space-y-2">
            {collections.map(collection => (
              <div 
                key={collection.id}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Layers className="w-6 h-6 text-purple-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{collection.name}</p>
                  <p className="text-sm text-muted-foreground">{collection.userEmail}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{collection.imageCount}</p>
                  <p className="text-sm text-muted-foreground">images</p>
                </div>
              </div>
            ))}
            {collections.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No collections found
              </div>
            )}
          </div>
        )}

        {/* Projects Content */}
        {activeTab === 'projects' && (
          <div className="space-y-2">
            {projects.map(project => (
              <div 
                key={project.id}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-6 h-6 text-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(project.storageUsed)} / {formatBytes(project.quotaBytes)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{project.imageCount}</p>
                  <p className="text-sm text-muted-foreground">images</p>
                </div>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, (project.storageUsed / project.quotaBytes) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No projects found
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
