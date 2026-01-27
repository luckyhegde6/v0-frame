'use client'

import React from "react"

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Upload, X, ImageIcon, FileUp } from 'lucide-react'

interface UploadedFile {
  id: string
  name: string
  preview: string
  file: File
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [collectionName, setCollectionName] = useState('')
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })

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

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    )

    processFiles(droppedFiles)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(file =>
        file.type.startsWith('image/')
      )
      processFiles(selectedFiles)
    }
  }, [])

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
        if (collectionName) {
          formData.append('collection', collectionName)
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }
        currentIdx++
      }

      setFiles([])
      setCollectionName('')
      alert('Upload successful!')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="text-2xl font-bold tracking-tighter">
          <span className="text-primary">FRAME</span>
        </Link>
        <Link href="/gallery" className="text-sm text-foreground/80 hover:text-primary transition-colors">
          Gallery
        </Link>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-12 max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Upload Your Images</h1>
          <p className="text-lg text-foreground/60">
            Start building your gallery. Drag and drop or click to select images.
          </p>
        </div>

        {/* Collection Input */}
        <div className="mb-8 p-6 bg-card border border-border rounded-2xl">
          <label htmlFor="collection" className="block text-sm font-medium mb-2 text-foreground/70">
            Add to Collection (Optional)
          </label>
          <input
            type="text"
            id="collection"
            placeholder="e.g. Summer Vacation, Portfolio..."
            className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            disabled={isUploading}
          />
          <p className="mt-2 text-xs text-foreground/40">
            Creating a new name will create a new collection
          </p>
        </div>

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
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="p-4 bg-primary/10 rounded-xl">
              <Upload size={40} className="text-primary" />
            </div>
            <div>
              <p className="text-xl font-semibold mb-2">
                {isDragging ? 'Drop your images here' : 'Drag and drop your images'}
              </p>
              <p className="text-foreground/60">or click to select files from your device</p>
            </div>
          </div>
        </div>

        {/* File Preview */}
        {files.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">
              {files.length} {files.length === 1 ? 'image' : 'images'} selected
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {files.map(file => (
                <div key={file.id} className="relative group">
                  <img
                    src={file.preview || "/placeholder.svg"}
                    alt={file.name}
                    className="w-full h-40 object-cover rounded-lg border border-border group-hover:border-primary/50 transition-colors"
                  />
                  {!isUploading && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="absolute top-2 right-2 p-1 bg-background/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                      title="Remove image"
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
                disabled={isUploading}
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
                    Upload {files.length} {files.length === 1 ? 'Image' : 'Images'}
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
                No images selected yet. Upload to get started!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Upload Progress Modal */}
      {isUploading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">Uploading Images</h3>
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
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span>Please do not close this window</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
