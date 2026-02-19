'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { FolderOpen, Image as ImageIcon, Loader2, Download, Calendar } from 'lucide-react'

interface SharedProject {
  id: string
  name: string
  description: string | null
  images: {
    id: string
    title: string
    width: number
    height: number
    thumbnailPath: string | null
    previewPath: string | null
  }[]
}

export default function SharePage() {
  const params = useParams()
  const token = params.id as string
  
  const [project, setProject] = useState<SharedProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      fetchSharedProject()
    }
  }, [token])

  const fetchSharedProject = async () => {
    try {
      const response = await fetch(`/api/share?token=${token}`)
      
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to load shared project')
        return
      }

      const data = await response.json()
      setProject(data.project)
    } catch (error) {
      setError('Failed to load shared project')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{error}</h1>
        <p className="text-muted-foreground">This share link may be expired or invalid.</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Project not found</h1>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{project.name}</h1>
                {project.description && (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="w-4 h-4" />
              <span>{project.images.length} images</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {project.images.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No images in this project</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {project.images.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square bg-muted rounded-lg overflow-hidden"
              >
                {image.thumbnailPath ? (
                  <img
                    src={image.thumbnailPath}
                    alt={image.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {image.previewPath && (
                    <a
                      href={image.previewPath}
                      download
                      className="p-3 bg-white rounded-full text-black hover:bg-gray-100 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  )}
                </div>

                {/* Image info */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-xs text-white truncate">{image.title}</p>
                  <p className="text-xs text-white/70">{image.width} x {image.height}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Shared via FRAME
          </p>
        </div>
      </footer>
    </div>
  )
}
