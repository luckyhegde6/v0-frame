'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import { Upload, Grid, List, Loader2, Cloud, ArrowLeft } from 'lucide-react'
import { GallerySearch } from '@/components/gallery-search'
import { CollectionManager } from '@/components/collection-manager'
import { ImageCard } from '@/components/image-card'
import { UserNav } from '@/components/user-nav'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface GalleryImage {
  id: string
  src: string
  title: string
  uploaded: string
  size?: string
  dimensions?: string
  mimeType?: string
}

function Breadcrumbs() {
  const pathname = usePathname()
  
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-primary transition-colors">Home</Link>
      <span>/</span>
      <span className="text-foreground font-medium">Gallery</span>
    </nav>
  )
}

export default function GalleryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'recent' | 'favorites'>('all')
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [collections, setCollections] = useState<{ id: string; name: string; count: number }[]>([])

  useEffect(() => {
    const fetchGalleryData = async () => {
      try {
        const response = await fetch('/api/images')
        const result = await response.json()

        if (result.data) {
          const mappedImages = result.data.map((img: any) => ({
            id: img.id,
            src: `/api/images/${img.id}`,
            title: img.title || 'Untitled Image',
            uploaded: new Date(img.createdAt).toLocaleDateString(),
            size: (img.sizeBytes / 1024 / 1024).toFixed(2) + ' MB',
            dimensions: `${img.width} × ${img.height}`,
            mimeType: img.mimeType.split('/')[1].toUpperCase(),
            collectionIds: img.collections?.map((c: any) => c.id) || [],
            isSyncing: img.isSyncing
          }))
          setImages(mappedImages)
        }

        if (result.collections) {
          setCollections(result.collections)
        }
      } catch (error) {
        console.error('Failed to fetch gallery data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchGalleryData()
  }, [])

  const filteredImages = useMemo(() => {
    let result = images

    if (selectedCollection) {
      result = result.filter(img => (img as any).collectionIds?.includes(selectedCollection))
    }

    if (searchQuery) {
      result = result.filter(img =>
        img.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filter === 'recent') {
      result = [...result].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 4)
    }

    return result
  }, [images, searchQuery, filter, selectedCollection])

  const selectedImage = selectedId ? images.find(img => img.id === selectedId) : null

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-bold tracking-tighter">
            <span className="text-primary">FRAME</span>
          </Link>
          <Breadcrumbs />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === 'grid'
                  ? 'bg-primary/20 text-primary'
                  : 'text-foreground/60 hover:text-foreground'
              )}
              title="Grid view"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === 'list'
                  ? 'bg-primary/20 text-primary'
                  : 'text-foreground/60 hover:text-foreground'
              )}
              title="List view"
            >
              <List size={20} />
            </button>
          </div>
          <Link 
            href="/upload" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Upload</span>
          </Link>
          <UserNav />
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-12 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <CollectionManager
            collections={collections}
            selectedCollection={selectedCollection}
            onSelectCollection={setSelectedCollection}
            onCreateCollection={(name) => {
              setCollections([...collections, { id: Math.random().toString(), name, count: 0 }])
            }}
          />

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Your Gallery</h1>
              <p className="text-lg text-foreground/60">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading images...
                  </span>
                ) : (
                  `${filteredImages.length} ${filteredImages.length === 1 ? 'image' : 'images'} · Click to view details`
                )}
              </p>
            </div>

            {/* Search and Filters */}
            <GallerySearch
              onSearch={setSearchQuery}
              onFilterChange={setFilter}
              currentFilter={filter}
            />

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-card animate-pulse rounded-lg border border-border" />
                  ))
                ) : filteredImages.length > 0 ? (
                  filteredImages.map(image => (
                    <ImageCard
                      key={image.id}
                      id={image.id}
                      src={image.src || "/placeholder.svg"}
                      title={image.title}
                      uploaded={image.uploaded}
                      isSyncing={(image as any).isSyncing}
                      onClick={() => setSelectedId(image.id)}
                      onDelete={() => console.log('Delete', image.id)}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <p className="text-foreground/60">No images found</p>
                    <Link 
                      href="/upload" 
                      className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Upload your first image
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-2">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 bg-card animate-pulse rounded-lg border border-border" />
                  ))
                ) : filteredImages.length > 0 ? (
                  filteredImages.map(image => (
                    <div
                      key={image.id}
                      onClick={() => setSelectedId(image.id)}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card hover:border-primary/50 transition-colors cursor-pointer group"
                    >
                      <img
                        src={image.src || "/placeholder.svg"}
                        alt={image.title}
                        className="w-16 h-16 object-cover rounded border border-border group-hover:border-primary/50 transition-colors"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{image.title}</p>
                          {(image as any).isSyncing && (
                            <span title="Syncing...">
                              <Cloud size={14} className="text-primary animate-pulse" />
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/60">{image.uploaded}</p>
                      </div>
                      <div className="text-right text-sm text-foreground/60">
                        ID: {image.id}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-foreground/60">No images found</p>
                    <Link 
                      href="/upload" 
                      className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Upload your first image
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-2xl w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selectedImage.src || "/placeholder.svg"}
              alt={selectedImage.title}
              className="w-full aspect-video object-cover"
            />
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedImage.title}</h2>
                  <p className="text-foreground/60">Uploaded {selectedImage.uploaded}</p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-foreground/60 hover:text-foreground transition-colors text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-8 pb-8 border-b border-border">
                <div>
                  <p className="text-sm text-foreground/60 mb-1">Format</p>
                  <p className="font-semibold">{selectedImage.mimeType || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60 mb-1">Size</p>
                  <p className="font-semibold">{selectedImage.size || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60 mb-1">Dimensions</p>
                  <p className="font-semibold">{selectedImage.dimensions || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
                  Download
                </button>
                <button className="flex-1 px-4 py-2 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors">
                  Share
                </button>
                <button className="flex-1 px-4 py-2 border border-destructive text-destructive rounded-lg font-medium hover:bg-destructive/5 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
