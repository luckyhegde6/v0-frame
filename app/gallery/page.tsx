'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Upload, Grid, List } from 'lucide-react'
import { GallerySearch } from '@/components/gallery-search'
import { CollectionManager } from '@/components/collection-manager'
import { ImageCard } from '@/components/image-card'

interface GalleryImage {
  id: string
  src: string
  title: string
  uploaded: string
}

// Mock gallery data - using SVG data URLs
const mockImages: GalleryImage[] = [
  {
    id: '1',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%234a5568" width="500" height="500"/%3E%3Ctext x="50%25" y="50%25" dominantBaseline="middle" textAnchor="middle" fontFamily="sans-serif" fontSize="32" fill="%23ffffff"%3EMountain Vista%3C/text%3E%3C/svg%3E',
    title: 'Mountain Vista',
    uploaded: '2 days ago',
  },
  {
    id: '2',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%232d3748" width="500" height="500"/%3E%3Ctext x="50%25" y="50%25" dominantBaseline="middle" textAnchor="middle" fontFamily="sans-serif" fontSize="32" fill="%23ffffff"%3EUrban Landscape%3C/text%3E%3C/svg%3E',
    title: 'Urban Landscape',
    uploaded: '1 week ago',
  },
  {
    id: '3',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%23704214" width="500" height="500"/%3E%3Ctext x="50%25" y="50%25" dominantBaseline="middle" textAnchor="middle" fontFamily="sans-serif" fontSize="32" fill="%23ffffff"%3EGolden Hour%3C/text%3E%3C/svg%3E',
    title: 'Golden Hour',
    uploaded: '2 weeks ago',
  },
  {
    id: '4',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%23276749" width="500" height="500"/%3E%3Ctext x="50%25" y="50%25" dominantBaseline="middle" textAnchor="middle" fontFamily="sans-serif" fontSize="32" fill="%23ffffff"%3EForest Path%3C/text%3E%3C/svg%3E',
    title: 'Forest Path',
    uploaded: '3 weeks ago',
  },
  {
    id: '5',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%23234e52" width="500" height="500"/%3E%3Ctext x="50%25" y="50%25" dominantBaseline="middle" textAnchor="middle" fontFamily="sans-serif" fontSize="32" fill="%23ffffff"%3EBeach Sunset%3C/text%3E%3C/svg%3E',
    title: 'Beach Sunset',
    uploaded: '1 month ago',
  },
  {
    id: '6',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%235a4a7f" width="500" height="500"/%3E%3Ctext x="50%25" y="50%25" dominantBaseline="middle" textAnchor="middle" fontFamily="sans-serif" fontSize="32" fill="%23ffffff"%3EAlpine Peak%3C/text%3E%3C/svg%3E',
    title: 'Alpine Peak',
    uploaded: '1 month ago',
  },
  {
    id: '7',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%231a202c" width="500" height="500"/%3E%3Ctext x="50%25" y="50%25" dominantBaseline="middle" textAnchor="middle" fontFamily="sans-serif" fontSize="32" fill="%23ffffff"%3ENight Sky%3C/text%3E%3C/svg%3E',
    title: 'Night Sky',
    uploaded: '2 months ago',
  },
  {
    id: '8',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%234c5282" width="500" height="500"/%3E%3Ctext x="50%25" y="50%25" dominantBaseline="middle" textAnchor="middle" fontFamily="sans-serif" fontSize="32" fill="%23ffffff"%3EPortrait Study%3C/text%3E%3C/svg%3E',
    title: 'Portrait Study',
    uploaded: '2 months ago',
  },
]

export default function GalleryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'recent' | 'favorites'>('all')
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [collections, setCollections] = useState([
    { id: '1', name: 'Landscapes', count: 3 },
    { id: '2', name: 'Portraits', count: 2 },
    { id: '3', name: 'Travel', count: 3 },
  ])

  const filteredImages = useMemo(() => {
    let result = mockImages

    if (searchQuery) {
      result = result.filter(img =>
        img.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filter === 'recent') {
      result = result.slice(0, 4)
    }

    return result
  }, [searchQuery, filter])

  const selectedImage = selectedId ? mockImages.find(img => img.id === selectedId) : null

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <Link href="/" className="text-2xl font-bold tracking-tighter">
          <span className="text-primary">FRAME</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary/20 text-primary'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
              title="Grid view"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary/20 text-primary'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
              title="List view"
            >
              <List size={20} />
            </button>
          </div>
          <Link href="/upload" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
            <Upload size={16} />
            Upload
          </Link>
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
                {filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'} · Click to view details
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
                {filteredImages.length > 0 ? (
                  filteredImages.map(image => (
                    <ImageCard
                      key={image.id}
                      id={image.id}
                      src={image.src || "/placeholder.svg"}
                      title={image.title}
                      uploaded={image.uploaded}
                      onClick={() => setSelectedId(image.id)}
                      onDelete={() => console.log('Delete', image.id)}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <p className="text-foreground/60">No images found</p>
                  </div>
                )}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-2">
                {filteredImages.length > 0 ? (
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
                        <p className="font-semibold text-foreground">{image.title}</p>
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
                  <p className="font-semibold">JPG</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60 mb-1">Size</p>
                  <p className="font-semibold">2.4 MB</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60 mb-1">Dimensions</p>
                  <p className="font-semibold">4000 × 2667</p>
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
