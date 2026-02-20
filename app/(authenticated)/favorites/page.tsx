'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, Grid, List, Loader2, Search, ArrowLeft, Image as ImageIcon, Heart } from 'lucide-react'
import { ImageCard } from '@/components/image-card'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface FavoriteImage {
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
      <span className="text-foreground font-medium">Favorites</span>
    </nav>
  )
}

export default function FavoritesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [images, setImages] = useState<FavoriteImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/images?favorites=true')
      const result = await response.json()

      if (result.data) {
        const mappedImages = result.data.map((img: any) => ({
          id: img.id,
          src: `/api/images/${img.id}`,
          title: img.title || 'Untitled Image',
          uploaded: new Date(img.createdAt).toLocaleDateString(),
          size: (img.sizeBytes / 1024 / 1024).toFixed(2) + ' MB',
          dimensions: `${img.width} × ${img.height}`,
          mimeType: img.mimeType?.split('/')[1]?.toUpperCase()
        }))
        setImages(mappedImages)
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredImages = images.filter(img => 
    img.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === 'grid'
                  ? 'bg-primary/20 text-primary'
                  : 'text-foreground/60 hover:text-foreground'
              )}
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
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div className="border-b border-border px-6 py-4 bg-muted/50">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          Favorites
        </h1>
        <p className="text-muted-foreground">Your favorite photos and videos</p>
      </div>

      {/* Search */}
      <div className="px-6 py-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No favorites yet</p>
          <p className="text-sm mt-2">Star photos to add them to your favorites</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="px-6 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredImages.map(image => (
              <ImageCard
                key={image.id}
                id={image.id}
                src={image.src}
                title={image.title}
                uploaded={image.uploaded}
                size={image.size}
                dimensions={image.dimensions}
                mimeType={image.mimeType}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-6 pb-8 space-y-2">
          {filteredImages.map(image => (
            <div
              key={image.id}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{image.title}</h3>
                <p className="text-sm text-muted-foreground">{image.dimensions} · {image.size}</p>
              </div>
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
