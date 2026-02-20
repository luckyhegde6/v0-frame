'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  FolderOpen, 
  ArrowLeft, 
  Loader2, 
  Folder, 
  File, 
  Image as ImageIcon,
  HardDrive,
  User,
  ChevronRight,
  ChevronDown,
  Copy
} from 'lucide-react'
import { handleApiError, showSuccess } from '@/lib/error-handler'

interface DirectoryNode {
  name: string
  displayName?: string
  type: 'directory' | 'file' | 'directory-reference'
  path: string
  size?: number
  children?: DirectoryNode[]
  imageCount?: number
  category?: string
  dimensions?: string
  status?: string
  note?: string
  count?: number
  preview?: string
}

interface ProjectStructure {
  project: {
    id: string
    name: string
    owner: { name: string | null; email: string | null }
    storageUsed: string
    quotaBytes: string
  }
  directories: DirectoryNode[]
}

export default function ProjectStructurePage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [structure, setStructure] = useState<ProjectStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

  const fetchStructure = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/structure`)
      if (response.ok) {
        const data = await response.json()
        setStructure(data)
        // Expand root by default
        if (data.directories.length > 0) {
          setExpandedDirs(new Set([data.directories[0].path]))
        }
      }
    } catch (error) {
      handleApiError(error, 'FetchStructure')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchStructure()
    }
  }, [projectId])

  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const formatBytes = (bytes: number | undefined) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path)
    showSuccess('Path copied to clipboard')
  }

  const renderNode = (node: DirectoryNode, level: number = 0) => {
    const isExpanded = expandedDirs.has(node.path)
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={node.path} className="select-none">
        <div 
          className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
            level > 0 ? 'ml-' + (level * 4) : ''
          }`}
          style={{ marginLeft: level > 0 ? `${level * 16}px` : 0 }}
        >
          {node.type === 'directory' && hasChildren && (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleDir(node.path) }}
              className="p-1 hover:bg-muted rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          {node.type === 'directory' && !hasChildren && <div className="w-6" />}
          
          {node.type === 'directory' || node.type === 'directory-reference' ? (
            <Folder className="w-5 h-5 text-yellow-500" />
          ) : (
            <ImageIcon className="w-5 h-5 text-blue-500" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">
                {node.displayName || node.name}
              </span>
              {node.category && (
                <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                  {node.category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {node.size !== undefined && <span>{formatBytes(node.size)}</span>}
              {node.imageCount !== undefined && <span>{node.imageCount} images</span>}
              {node.dimensions && <span>{node.dimensions}</span>}
              {node.status && <span className="capitalize">{node.status.toLowerCase()}</span>}
              {node.note && <span className="text-yellow-500">{node.note}</span>}
              {node.count !== undefined && <span>{node.count} items</span>}
            </div>
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); copyPath(node.path) }}
            className="p-2 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy path"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!structure) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load structure</h2>
        <Link href={`/admin/projects`} className="text-primary hover:underline">
          Back to Projects
        </Link>
      </div>
    )
  }

  const usagePercent = (BigInt(structure.project.storageUsed) * BigInt(100)) / BigInt(structure.project.quotaBytes)

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link
            href="/admin/projects"
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Projects
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{structure.project.name}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Storage Structure</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <HardDrive className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Storage Structure</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <FolderOpen className="w-4 h-4" />
                  {structure.project.name}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {structure.project.owner.name || structure.project.owner.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{formatBytes(Number(structure.project.storageUsed))}</p>
                <p className="text-sm text-muted-foreground">Storage Used</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Folder className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{formatBytes(Number(structure.project.quotaBytes))}</p>
                <p className="text-sm text-muted-foreground">Storage Quota</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                Number(usagePercent) > 90 ? 'bg-red-500/10 text-red-500' : 
                Number(usagePercent) > 75 ? 'bg-yellow-500/10 text-yellow-500' : 
                'bg-green-500/10 text-green-500'
              }`}>
                <span className="text-sm font-bold">{Number(usagePercent)}%</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{Number(usagePercent)}%</p>
                <p className="text-sm text-muted-foreground">Quota Used</p>
              </div>
            </div>
          </div>
        </div>

        {/* Directory Tree */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Directory Structure</h2>
          <div className="space-y-1">
            {structure.directories.map(dir => renderNode(dir))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-medium mb-2">Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-yellow-500" />
                <span>Directory</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <span>Image File</span>
              </div>
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-yellow-500/50" />
                <span>Reference (stored elsewhere)</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
