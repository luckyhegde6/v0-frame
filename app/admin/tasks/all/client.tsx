'use client'

import Link from 'next/link'
import { 
  ArrowLeft, Zap, Image as ImageIcon, Settings, 
  Database, HardDrive, Archive, Upload, RefreshCw, Users,
  ChevronRight, Play, ScanFace, Box, UserCheck
} from 'lucide-react'

const TASK_TYPES = [
  { 
    value: 'COMPRESS_IMAGES', 
    label: 'Compress Images', 
    icon: Zap, 
    description: 'Compress existing images to reduce file size while maintaining quality. Select from projects, albums, or individual images.',
    features: ['Quality control', 'Size limits', 'Preserve originals']
  },
  { 
    value: 'GENERATE_THUMBNAILS', 
    label: 'Generate Thumbnails', 
    icon: ImageIcon, 
    description: 'Regenerate missing thumbnails for images. Supports multiple sizes from 128px to 1024px.',
    features: ['Multiple sizes', 'Overwrite option', 'Batch processing']
  },
  { 
    value: 'REGENERATE_METADATA', 
    label: 'Regenerate Metadata', 
    icon: Settings, 
    description: 'Re-extract EXIF metadata from images including GPS coordinates and camera information.',
    features: ['GPS extraction', 'Camera info', 'Overwrite option']
  },
  { 
    value: 'EXTRACT_ARCHIVE', 
    label: 'Extract Archive', 
    icon: Archive, 
    description: 'Extract uploaded ZIP/TAR archives and automatically organize contents into albums.',
    features: ['ZIP/TAR support', 'Auto-create albums', 'Folder structure']
  },
  { 
    value: 'SYNC_STORAGE', 
    label: 'Sync Storage', 
    icon: RefreshCw, 
    description: 'Sync storage with cloud providers like Supabase. Upload, download, or bidirectional sync.',
    features: ['Cloud sync', 'Bidirectional', 'Auto cleanup']
  },
  { 
    value: 'BACKUP_DATABASE', 
    label: 'Backup Database', 
    icon: Database, 
    description: 'Create database backups in SQL or custom format. Optionally include file storage.',
    features: ['SQL dump', 'Custom format', 'Include files']
  },
  { 
    value: 'CLEANUP_TEMP', 
    label: 'Cleanup Temp Files', 
    icon: HardDrive, 
    description: 'Clean up temporary files older than a specified number of days. Dry run mode available.',
    features: ['Age filter', 'Dry run', 'Safe deletion']
  },
  { 
    value: 'OPTIMIZE_STORAGE', 
    label: 'Optimize Storage', 
    icon: HardDrive, 
    description: 'Find and remove duplicate files, orphaned files, and optimize storage allocation.',
    features: ['Find duplicates', 'Remove orphans', 'Storage report']
  },
  { 
    value: 'OFFLINE_UPLOAD', 
    label: 'Offline Upload', 
    icon: Upload, 
    description: 'Batch upload from offline storage devices. Filter by file type.',
    features: ['Batch upload', 'File filters', 'Progress tracking']
  },
  { 
    value: 'SYNC_USERS', 
    label: 'Sync Users', 
    icon: Users, 
    description: 'Sync user data with external authentication providers.',
    features: ['Auth0 sync', 'Firebase sync', 'Custom sources']
  },
  { 
    value: 'DETECT_FACES', 
    label: 'Detect Faces', 
    icon: ScanFace, 
    description: 'Detect faces in images and generate embeddings for face recognition.',
    features: ['Face detection', 'Embeddings', 'Confidence threshold']
  },
  { 
    value: 'DETECT_OBJECTS', 
    label: 'Detect Objects', 
    icon: Box, 
    description: 'Detect objects in images using AI (persons, pets, products, venues).',
    features: ['Object detection', 'Categories', 'Confidence threshold']
  },
  { 
    value: 'GROUP_FACES', 
    label: 'Group Faces', 
    icon: UserCheck, 
    description: 'Group similar faces together using embeddings.',
    features: ['Face grouping', 'Similarity threshold', 'Auto-labeling']
  }
]

export default function AllTasksClient() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/tasks"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tasks
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold mt-4">All Task Types</h1>
          <p className="text-muted-foreground">Select a task type to configure and run</p>
        </div>
      </div>

      {/* Task Types Grid */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid gap-4">
          {TASK_TYPES.map(taskType => {
            const Icon = taskType.icon
            return (
              <Link
                key={taskType.value}
                href={`/admin/tasks/${taskType.value}`}
                className="flex items-start gap-4 p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{taskType.label}</h3>
                  </div>
                  <p className="text-muted-foreground mt-1">{taskType.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {taskType.features.map(feature => (
                      <span 
                        key={feature}
                        className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
