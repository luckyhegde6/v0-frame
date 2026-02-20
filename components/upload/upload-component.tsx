'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Upload, X, FileUp, ArrowLeft, FolderOpen, Image as ImageIcon, Film, Loader2, Settings } from 'lucide-react'
import { handleApiError, showSuccess } from '@/lib/error-handler'

interface UploadedFile {
  id: string
  name: string
  preview: string
  file: File
}

interface Project {
  id: string
  name: string
}

interface Album {
  id: string
  name: string
  projectId: string
}

interface UploadComponentProps {
  mode?: 'gallery' | 'project' | 'album'
  initialProjectId?: string
  initialAlbumId?: string
  userRole?: 'USER' | 'PRO' | 'ADMIN' | 'SUPERADMIN' | 'CLIENT'
  onUploadComplete?: () => void
  showBackLink?: boolean
  backLinkHref?: string
  backLinkText?: string
  title?: string
}

export function UploadComponent({
  mode = 'gallery',
  initialProjectId,
  initialAlbumId,
  userRole = 'USER',
  onUploadComplete,
  showBackLink = true,
  backLinkHref = '/gallery',
  backLinkText = 'Back to Gallery',
  title = 'Upload Images'
}: UploadComponentProps) {
  const router = useRouter()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  
  // For gallery mode
  const [collectionName, setCollectionName] = useState('')
  const [collectionMode, setCollectionMode] = useState<'existing' | 'new'>('existing')
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([])
  const [existingCollections, setExistingCollections] = useState<{ id: string; name: string }[]>([])
  
  // For project/album mode
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '')
  const [albums, setAlbums] = useState<Album[]>([])
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(initialAlbumId || '')

  useEffect(() => {
    if (mode === 'gallery') {
      fetchCollections()
    } else if (mode === 'project' || mode === 'album') {
      fetchProjects()
    }
  }, [mode])

  useEffect(() => {
    if (selectedProjectId) {
      fetchAlbums(selectedProjectId)
    }
  }, [selectedProjectId])

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/images')
      const result = await response.json()
      if (result.collections) {
        setExistingCollections(result.collections)
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const result = await response.json()
      if (result.projects) {
        setProjects(result.projects)
        if (!selectedProjectId && result.projects.length > 0) {
          setSelectedProjectId(result.projects[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const fetchAlbums = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/albums`)
      const result = await response.json()
      if (result.albums) {
        setAlbums(result.albums)
      }
    } catch (error) {
      console.error('Failed to fetch albums:', error)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const acceptedTypes = mode === 'gallery' 
      ? ['image/']
      : ['image/', 'video/']

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
      acceptedTypes.some(type => file.type.startsWith(type))
    )

    processFiles(droppedFiles)
  }, [mode])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const acceptedTypes = mode === 'gallery'
        ? ['image/']
        : ['image/', 'video/']

      const selectedFiles = Array.from(e.target.files).filter(file =>
        acceptedTypes.some(type => file.type.startsWith(type))
      )
      processFiles(selectedFiles)
    }
  }, [mode])

  const processFiles = (filesToAdd: File[]) => {
    filesToAdd.forEach(file => {
      const preview = URL.createObjectURL(file)
      setFiles(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        preview,
        file
      }])
    })
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const toggleCollectionId = (id: string) => {
    setSelectedCollectionIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress({ current: 0, total: files.length })

    try {
      let currentIdx = 0
      for (const file of files) {
        setUploadProgress(prev => ({ ...prev, current: currentIdx + 1 }))
        const formData = new FormData()
        formData.append('file', file.file)
        formData.append('title', file.name.split('.')[0])

        if (mode === 'gallery') {
          if (collectionMode === 'existing' && selectedCollectionIds.length > 0) {
            formData.append('collectionIds', JSON.stringify(selectedCollectionIds))
          } else if (collectionMode === 'new' && collectionName.trim()) {
            formData.append('collection', collectionName.trim())
          }
        } else if (mode === 'project' && selectedProjectId) {
          formData.append('projectId', selectedProjectId)
        } else if (mode === 'album' && selectedAlbumId) {
          formData.append('albumId', selectedAlbumId)
          formData.append('projectId', selectedProjectId)
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Upload failed');
        }
        currentIdx++
      }

      setFiles([])
      setCollectionName('')
      setSelectedCollectionIds([])
      showSuccess('Upload successful!')
      onUploadComplete?.()
    } catch (error) {
      handleApiError(error, 'Upload')
    } finally {
      setIsUploading(false)
    }
  }

  const openProjectSettings = () => {
    if (selectedProjectId) {
      router.push(`/projects/${selectedProjectId}?tab=settings`)
    }
  }

  const canUploadToProject = ['PRO', 'ADMIN', 'SUPERADMIN'].includes(userRole)
  const canUploadToAlbum = canUploadToProject

  const getAcceptedTypes = () => {
    if (mode === 'gallery') return 'image/*'
    return 'image/*,video/*'
  }

  return (
    <div className="min-h-screen bg-background">
      {showBackLink && (
        <div className="border-b border-border px-6 py-3 flex items-center justify-between sticky top-16 z-30 bg-background/80 backdrop-blur-sm">
          <div></div>
          <Link
            href={backLinkHref}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLinkText}
          </Link>
        </div>
      )}

      <div className="border-b border-border px-6 py-3 bg-muted/50">
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

      <main className="px-6 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-lg text-foreground/60">
            {mode === 'gallery'
              ? 'Start building your gallery. Drag and drop or click to select images.'
              : mode === 'project'
              ? 'Upload photos or videos to your project.'
              : 'Upload photos or videos to your album.'}
          </p>
        </div>

        {/* Project/Album Selection for PRO/ADMIN */}
        {(mode === 'project' || mode === 'album') && canUploadToProject && (
          <div className="mb-8 p-6 bg-card border border-border rounded-2xl">
            <h3 className="text-sm font-medium mb-4 text-foreground/70">Select Destination</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project</label>
                <div className="flex gap-2">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    disabled={isUploading}
                    className="flex-1 bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select a project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={openProjectSettings}
                    disabled={!selectedProjectId || isUploading}
                    className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50"
                    title="Project Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {mode === 'album' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Album</label>
                  <select
                    value={selectedAlbumId}
                    onChange={(e) => setSelectedAlbumId(e.target.value)}
                    disabled={!selectedProjectId || isUploading}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select an album</option>
                    {albums.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {mode === 'album' && selectedProjectId && (
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/projects/${encodeURIComponent(selectedProjectId)}?tab=albums`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <FolderOpen className="w-4 h-4" />
                  Manage Albums
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Collection Section for Gallery Mode */}
        {mode === 'gallery' && (
          <div className="mb-8 p-6 bg-card border border-border rounded-2xl">
            <h3 className="text-sm font-medium mb-4 text-foreground/70">Assign to Collections</h3>

            <div className="flex gap-6 mb-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="collectionMode"
                  className="w-4 h-4 text-primary bg-background border-border focus:ring-primary/50"
                  checked={collectionMode === 'existing'}
                  onChange={() => setCollectionMode('existing')}
                  disabled={isUploading}
                />
                <span className={`text-sm font-medium transition-colors ${collectionMode === 'existing' ? 'text-foreground' : 'text-foreground/40 group-hover:text-foreground/60'}`}>
                  Add to Existing
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="collectionMode"
                  className="w-4 h-4 text-primary bg-background border-border focus:ring-primary/50"
                  checked={collectionMode === 'new'}
                  onChange={() => setCollectionMode('new')}
                  disabled={isUploading}
                />
                <span className={`text-sm font-medium transition-colors ${collectionMode === 'new' ? 'text-foreground' : 'text-foreground/40 group-hover:text-foreground/60'}`}>
                  Create New
                </span>
              </label>
            </div>

            {collectionMode === 'existing' ? (
              <div className="space-y-2">
                <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {existingCollections.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {existingCollections.map(c => (
                        <button
                          key={c.id}
                          onClick={() => toggleCollectionId(c.id)}
                          disabled={isUploading}
                          className={`text-left px-4 py-2 rounded-lg border text-sm transition-all ${selectedCollectionIds.includes(c.id)
                            ? 'bg-primary/10 border-primary text-primary font-medium'
                            : 'bg-background border-border text-foreground/60 hover:border-primary/50 hover:text-foreground'
                            }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/40 italic py-2">No collections found. Create a new one!</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="e.g. Summer Vacation, Portfolio..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  disabled={isUploading}
                />
                <p className="text-xs text-foreground/40">
                  A new collection will be created with this name.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card hover:border-primary/50'
            }`}
        >
          <input
            type="file"
            multiple
            accept={getAcceptedTypes()}
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="p-4 bg-primary/10 rounded-xl">
              {mode === 'gallery' ? (
                <Upload size={40} className="text-primary" />
              ) : (
                <Film size={40} className="text-primary" />
              )}
            </div>
            <div>
              <p className="text-xl font-semibold mb-2">
                {isDragging ? 'Drop your files here' : 'Drag and drop your files'}
              </p>
              <p className="text-foreground/60">
                {mode === 'gallery' 
                  ? 'or click to select images from your device'
                  : 'or click to select photos or videos from your device'}
              </p>
            </div>
          </div>
        </div>

        {/* File Preview */}
        {files.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {files.map(file => (
                <div key={file.id} className="relative group">
                  {file.file.type.startsWith('video/') ? (
                    <video
                      src={file.preview}
                      className="w-full h-40 object-cover rounded-lg border border-border group-hover:border-primary/50 transition-colors"
                    />
                  ) : (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-40 object-cover rounded-lg border border-border group-hover:border-primary/50 transition-colors"
                    />
                  )}
                  {!isUploading && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="absolute top-2 right-2 p-1 bg-background/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <p className="mt-2 text-sm text-foreground/70 truncate">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleUpload}
                disabled={isUploading || (mode !== 'gallery' && !selectedProjectId) || (mode === 'album' && !selectedAlbumId)}
                className="flex-1 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileUp size={20} />
                    Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
                  </>
                )}
              </button>
              <button
                onClick={() => setFiles([])}
                disabled={isUploading}
                className="px-8 py-4 border border-border text-foreground rounded-lg font-semibold hover:bg-card transition-colors disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {files.length === 0 && (
          <div className="mt-16 text-center">
            <div className="p-8 bg-card rounded-xl border border-border inline-block">
              <ImageIcon size={48} className="text-foreground/40 mx-auto mb-4" />
              <p className="text-foreground/60">
                No files selected yet. Upload to get started!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Upload Progress Modal */}
      {isUploading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">Uploading Files</h3>
            <p className="text-foreground/60 mb-6 font-medium">
              File {uploadProgress.current} of {uploadProgress.total}...
            </p>

            <div className="w-full bg-border rounded-full h-3 mb-6 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-4 text-sm text-foreground/70">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Please do not close this window</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
