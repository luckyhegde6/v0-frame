'use client'

import { useEffect, useState, Fragment, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Loader2, Zap, Image as ImageIcon, Settings, 
  Database, HardDrive, Archive, Upload, RefreshCw, Users,
  ChevronRight, Check, X, FolderOpen, Layers, Cloud, 
  Monitor, FolderUp, FileImage, AlertCircle, ExternalLink
} from 'lucide-react'
import { handleApiError, showSuccess } from '@/lib/error-handler'

const TASK_CONFIGS: Record<string, {
  label: string
  icon: any
  description: string
  requiresSource: boolean
  requiresDestination: boolean
  sourceTypes: ('project' | 'album' | 'images')[]
  configOptions: {
    name: string
    label: string
    type: 'select' | 'number' | 'toggle'
    options?: { value: string; label: string }[]
    default?: any
    min?: number
    max?: number
  }[]
}> = {
  COMPRESS_IMAGES: {
    label: 'Compress Images',
    icon: Zap,
    description: 'Compress images to reduce file size while maintaining quality',
    requiresSource: true,
    requiresDestination: false,
    sourceTypes: ['project', 'album', 'images'],
    configOptions: [
      {
        name: 'quality',
        label: 'Quality',
        type: 'select',
        options: [
          { value: 'high', label: 'High (90%)' },
          { value: 'medium', label: 'Medium (75%)' },
          { value: 'low', label: 'Low (60%)' }
        ],
        default: 'medium'
      },
      {
        name: 'maxWidth',
        label: 'Max Width (px)',
        type: 'number',
        default: 2000,
        min: 500,
        max: 8000
      },
      {
        name: 'maxHeight',
        label: 'Max Height (px)',
        type: 'number',
        default: 2000,
        min: 500,
        max: 8000
      },
      {
        name: 'preserveOriginal',
        label: 'Preserve Original',
        type: 'toggle',
        default: true
      }
    ]
  },
  GENERATE_THUMBNAILS: {
    label: 'Generate Thumbnails',
    icon: ImageIcon,
    description: 'Regenerate missing thumbnails for images',
    requiresSource: true,
    requiresDestination: false,
    sourceTypes: ['project', 'album', 'images'],
    configOptions: [
      {
        name: 'sizes',
        label: 'Thumbnail Sizes',
        type: 'select',
        options: [
          { value: 'all', label: 'All Sizes (128, 256, 512, 1024)' },
          { value: 'small', label: 'Small Only (128, 256)' },
          { value: 'large', label: 'Large Only (512, 1024)' }
        ],
        default: 'all'
      },
      {
        name: 'overwrite',
        label: 'Overwrite Existing',
        type: 'toggle',
        default: false
      }
    ]
  },
  EXTRACT_ARCHIVE: {
    label: 'Extract Archive',
    icon: Archive,
    description: 'Extract uploaded ZIP/TAR archives',
    requiresSource: true,
    requiresDestination: true,
    sourceTypes: ['project', 'album'],
    configOptions: [
      {
        name: 'createAlbum',
        label: 'Create New Album',
        type: 'toggle',
        default: true
      },
      {
        name: 'preserveStructure',
        label: 'Preserve Folder Structure',
        type: 'toggle',
        default: false
      }
    ]
  },
  SYNC_STORAGE: {
    label: 'Sync Storage',
    icon: RefreshCw,
    description: 'Sync storage with cloud providers',
    requiresSource: false,
    requiresDestination: false,
    sourceTypes: [],
    configOptions: [
      {
        name: 'direction',
        label: 'Sync Direction',
        type: 'select',
        options: [
          { value: 'upload', label: 'Upload to Cloud' },
          { value: 'download', label: 'Download from Cloud' },
          { value: 'bidirectional', label: 'Bidirectional' }
        ],
        default: 'upload'
      },
      {
        name: 'deleteAfterSync',
        label: 'Delete After Sync',
        type: 'toggle',
        default: false
      }
    ]
  },
  REGENERATE_METADATA: {
    label: 'Regenerate Metadata',
    icon: Settings,
    description: 'Re-extract EXIF metadata from images',
    requiresSource: true,
    requiresDestination: false,
    sourceTypes: ['project', 'album', 'images'],
    configOptions: [
      {
        name: 'extractGPS',
        label: 'Extract GPS Data',
        type: 'toggle',
        default: true
      },
      {
        name: 'extractCamera',
        label: 'Extract Camera Info',
        type: 'toggle',
        default: true
      },
      {
        name: 'overwrite',
        label: 'Overwrite Existing',
        type: 'toggle',
        default: false
      }
    ]
  },
  BACKUP_DATABASE: {
    label: 'Backup Database',
    icon: Database,
    description: 'Create database backup',
    requiresSource: false,
    requiresDestination: false,
    sourceTypes: [],
    configOptions: [
      {
        name: 'format',
        label: 'Backup Format',
        type: 'select',
        options: [
          { value: 'sql', label: 'SQL Dump' },
          { value: 'custom', label: 'Custom Format' }
        ],
        default: 'sql'
      },
      {
        name: 'includeFiles',
        label: 'Include File Storage',
        type: 'toggle',
        default: false
      }
    ]
  },
  CLEANUP_TEMP: {
    label: 'Cleanup Temp Files',
    icon: HardDrive,
    description: 'Clean up temporary files',
    requiresSource: false,
    requiresDestination: false,
    sourceTypes: [],
    configOptions: [
      {
        name: 'olderThanDays',
        label: 'Older Than (days)',
        type: 'number',
        default: 7,
        min: 1,
        max: 365
      },
      {
        name: 'dryRun',
        label: 'Dry Run (Preview Only)',
        type: 'toggle',
        default: true
      }
    ]
  },
  OPTIMIZE_STORAGE: {
    label: 'Optimize Storage',
    icon: HardDrive,
    description: 'Optimize storage allocation and remove duplicates',
    requiresSource: false,
    requiresDestination: false,
    sourceTypes: [],
    configOptions: [
      {
        name: 'findDuplicates',
        label: 'Find Duplicates',
        type: 'toggle',
        default: true
      },
      {
        name: 'removeOrphans',
        label: 'Remove Orphaned Files',
        type: 'toggle',
        default: true
      }
    ]
  },
  SYNC_USERS: {
    label: 'Sync Users',
    icon: Users,
    description: 'Sync user data with external sources',
    requiresSource: false,
    requiresDestination: false,
    sourceTypes: [],
    configOptions: [
      {
        name: 'source',
        label: 'Sync Source',
        type: 'select',
        options: [
          { value: 'auth0', label: 'Auth0' },
          { value: 'firebase', label: 'Firebase' },
          { value: 'custom', label: 'Custom' }
        ],
        default: 'custom'
      }
    ]
  },
  OFFLINE_UPLOAD: {
    label: 'Offline Upload',
    icon: Upload,
    description: 'Batch upload from local storage or cloud providers',
    requiresSource: false,
    requiresDestination: true,
    sourceTypes: [],
    configOptions: [
      {
        name: 'filePattern',
        label: 'File Pattern',
        type: 'select',
        options: [
          { value: 'all', label: 'All Files' },
          { value: 'images', label: 'Images Only' },
          { value: 'videos', label: 'Videos Only' }
        ],
        default: 'images'
      },
      {
        name: 'preserveStructure',
        label: 'Preserve Folder Structure',
        type: 'toggle',
        default: false
      }
    ]
  }
}

interface Project {
  id: string
  name: string
  albums: { id: string; name: string }[]
}

interface Album {
  id: string
  name: string
  projectId: string | null
  projectName?: string
  _count?: { images: number }
}

interface Image {
  id: string
  title: string
  thumbnailPath: string | null
  status: string
}

type UploadSource = 'computer' | 'google-drive' | 'dropbox'
type UploadMode = 'files' | 'folder'
type DestinationType = 'project' | 'album'

interface UploadingFile {
  id: string
  name: string
  size: number
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
  file?: File
}

interface CloudConnection {
  provider: 'google-drive' | 'dropbox'
  connected: boolean
  email?: string
  expiresAt?: Date
}

interface OfflineUploadUIProps {
  projects: Project[]
  albums: Album[]
  uploadSource: UploadSource
  setUploadSource: (v: UploadSource) => void
  uploadMode: UploadMode
  setUploadMode: (v: UploadMode) => void
  destinationType: DestinationType
  setDestinationType: (v: DestinationType) => void
  destinationProjectId: string
  setDestinationProjectId: (v: string) => void
  destinationAlbumId: string
  setDestinationAlbumId: (v: string) => void
  newAlbumName: string
  setNewAlbumName: (v: string) => void
  uploadingFiles: UploadingFile[]
  setUploadingFiles: (v: UploadingFile[]) => void
  cloudConnections: CloudConnection[]
  setCloudConnections: (v: CloudConnection[]) => void
  isAuthenticating: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  folderInputRef: React.RefObject<HTMLInputElement | null>
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleCloudConnect: (provider: 'google-drive' | 'dropbox') => void
  removeFile: (fileId: string) => void
  formatFileSize: (bytes: number) => string
  getTotalFileSize: () => string
  canProceed: () => boolean
  handleSubmit: () => void
  submitting: boolean
  configValues: Record<string, any>
  setConfigValues: (v: Record<string, any>) => void
}

function OfflineUploadUI({
  projects,
  albums,
  uploadSource,
  setUploadSource,
  uploadMode,
  setUploadMode,
  destinationType,
  setDestinationType,
  destinationProjectId,
  setDestinationProjectId,
  destinationAlbumId,
  setDestinationAlbumId,
  newAlbumName,
  setNewAlbumName,
  uploadingFiles,
  cloudConnections,
  handleCloudConnect,
  isAuthenticating,
  fileInputRef,
  folderInputRef,
  handleFileSelect,
  removeFile,
  formatFileSize,
  getTotalFileSize,
  canProceed,
  handleSubmit,
  submitting,
  configValues,
  setConfigValues
}: OfflineUploadUIProps) {
  const selectedProject = projects.find(p => p.id === destinationProjectId)
  const filteredAlbums = selectedProject 
    ? albums.filter(a => a.projectId === destinationProjectId)
    : albums

  return (
    <div className="space-y-6">
      {/* Step 1: Upload Source */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">1</span>
          Select Upload Source
        </h2>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setUploadSource('computer')}
            className={`p-4 rounded-lg border transition-colors ${
              uploadSource === 'computer'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Monitor className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Computer</p>
            <p className="text-xs text-muted-foreground mt-1">Local files</p>
          </button>
          <button
            onClick={() => setUploadSource('google-drive')}
            className={`p-4 rounded-lg border transition-colors ${
              uploadSource === 'google-drive'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Cloud className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Google Drive</p>
            <p className="text-xs text-muted-foreground mt-1">Cloud storage</p>
          </button>
          <button
            onClick={() => setUploadSource('dropbox')}
            className={`p-4 rounded-lg border transition-colors ${
              uploadSource === 'dropbox'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Cloud className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Dropbox</p>
            <p className="text-xs text-muted-foreground mt-1">Cloud storage</p>
          </button>
        </div>

        {/* Cloud Authentication */}
        {uploadSource !== 'computer' && (
          <div className="p-4 bg-muted/50 rounded-lg">
            {!cloudConnections.find(c => c.provider === uploadSource)?.connected ? (
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-sm text-muted-foreground mb-3">
                  Connect your {uploadSource === 'google-drive' ? 'Google Drive' : 'Dropbox'} account to import files
                </p>
                <button
                  onClick={() => handleCloudConnect(uploadSource)}
                  disabled={isAuthenticating}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg mx-auto hover:bg-primary/90 disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Connect {uploadSource === 'google-drive' ? 'Google Drive' : 'Dropbox'}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm">
                    Connected as {cloudConnections.find(c => c.provider === uploadSource)?.email}
                  </span>
                </div>
                <button className="text-sm text-primary hover:underline">
                  Disconnect
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload Mode Selection */}
        {uploadSource === 'computer' && (
          <>
            <h3 className="text-sm font-medium mb-3 mt-6">Upload Mode</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setUploadMode('files')}
                className={`p-4 rounded-lg border transition-colors ${
                  uploadMode === 'files'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <FileImage className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Files</p>
                <p className="text-xs text-muted-foreground mt-1">Select individual files</p>
              </button>
              <button
                onClick={() => setUploadMode('folder')}
                className={`p-4 rounded-lg border transition-colors ${
                  uploadMode === 'folder'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <FolderUp className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Folder</p>
                <p className="text-xs text-muted-foreground mt-1">Upload entire folder</p>
              </button>
            </div>

            {/* File/Folder Selection */}
            <div className="mt-6">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                {...{ webkitdirectory: '', directory: '' } as any}
              />
              
              <button
                onClick={() => {
                  if (uploadMode === 'files') {
                    fileInputRef.current?.click()
                  } else {
                    folderInputRef.current?.click()
                  }
                }}
                className="w-full p-8 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {uploadMode === 'files' 
                    ? 'Click to select files or drag and drop'
                    : 'Click to select a folder'
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports images and videos
                </p>
              </button>
            </div>

            {/* Selected Files List */}
            {uploadingFiles.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Selected Files ({uploadingFiles.length})</h3>
                  <span className="text-sm text-muted-foreground">{getTotalFileSize()}</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {uploadingFiles.slice(0, 20).map(file => (
                    <div key={file.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <FileImage className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                  {uploadingFiles.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      ...and {uploadingFiles.length - 20} more files
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Step 2: Destination */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">2</span>
          Select Destination
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => {
              setDestinationType('project')
              setDestinationAlbumId('')
            }}
            className={`p-4 rounded-lg border transition-colors ${
              destinationType === 'project'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <FolderOpen className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Project</p>
            <p className="text-xs text-muted-foreground mt-1">
              {uploadMode === 'folder' ? 'Create album in project' : 'Select project album'}
            </p>
          </button>
          <button
            onClick={() => setDestinationType('album')}
            className={`p-4 rounded-lg border transition-colors ${
              destinationType === 'album'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Layers className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Existing Album</p>
            <p className="text-xs text-muted-foreground mt-1">Add to existing album</p>
          </button>
        </div>

        {/* Destination Selection */}
        {destinationType === 'project' ? (
          <div>
            <label className="block text-sm font-medium mb-2">Select Project</label>
            <select
              value={destinationProjectId}
              onChange={(e) => setDestinationProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Choose a project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* New Album Name (for folder upload) */}
            {uploadMode === 'folder' && destinationProjectId && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">New Album Name</label>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="Album name"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Album will be created in "{selectedProject?.name}"
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">Select Album</label>
            <select
              value={destinationAlbumId}
              onChange={(e) => setDestinationAlbumId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Choose an album...</option>
              {albums.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.projectName ? `(${a.projectName})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Step 3: Configuration */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">3</span>
          Configuration
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">File Pattern</label>
            <select
              value={configValues.filePattern || 'images'}
              onChange={(e) => setConfigValues({ ...configValues, filePattern: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Files</option>
              <option value="images">Images Only</option>
              <option value="videos">Videos Only</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">Preserve Folder Structure</label>
              <p className="text-xs text-muted-foreground">Keep folder organization when uploading</p>
            </div>
            <button
              onClick={() => setConfigValues({ ...configValues, preserveStructure: !configValues.preserveStructure })}
              className={`w-12 h-6 rounded-full transition-colors ${
                configValues.preserveStructure ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                configValues.preserveStructure ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary & Submit */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        
        <div className="space-y-2 text-sm mb-6">
          <p><span className="text-muted-foreground">Files:</span> {uploadingFiles.length} ({getTotalFileSize()})</p>
          <p><span className="text-muted-foreground">Source:</span> {
            uploadSource === 'computer' ? 'Local Computer' :
            uploadSource === 'google-drive' ? 'Google Drive' : 'Dropbox'
          }</p>
          <p><span className="text-muted-foreground">Destination:</span> {
            destinationType === 'project' 
              ? `${selectedProject?.name || 'Select project'}${uploadMode === 'folder' ? ` → ${newAlbumName || 'New Album'}` : ''}`
              : albums.find(a => a.id === destinationAlbumId)?.name || 'Select album'
          }</p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/tasks"
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || submitting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Create Upload Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TaskConfigClient({ taskType }: { taskType: string }) {
  const router = useRouter()
  const params = useParams()
  
  const config = TASK_CONFIGS[taskType]
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Data
  const [projects, setProjects] = useState<Project[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [images, setImages] = useState<Image[]>([])
  
  // Selection state
  const [sourceType, setSourceType] = useState<'project' | 'album' | 'images'>('project')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedAlbum, setSelectedAlbum] = useState<string>('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [destinationAlbum, setDestinationAlbum] = useState<string>('')
  
  // Config options
  const [configValues, setConfigValues] = useState<Record<string, any>>({})
  
  // UI state
  const [step, setStep] = useState(1)
  
  // OFFLINE_UPLOAD specific state
  const [uploadSource, setUploadSource] = useState<UploadSource>('computer')
  const [uploadMode, setUploadMode] = useState<UploadMode>('files')
  const [destinationType, setDestinationType] = useState<DestinationType>('project')
  const [destinationProjectId, setDestinationProjectId] = useState<string>('')
  const [destinationAlbumId, setDestinationAlbumId] = useState<string>('')
  const [newAlbumName, setNewAlbumName] = useState<string>('')
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [cloudConnections, setCloudConnections] = useState<CloudConnection[]>([
    { provider: 'google-drive', connected: false },
    { provider: 'dropbox', connected: false }
  ])
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (config) {
      // Initialize config values with defaults
      const defaults: Record<string, any> = {}
      config.configOptions.forEach(opt => {
        defaults[opt.name] = opt.default
      })
      setConfigValues(defaults)
      
      // Fetch data
      fetchData()
    }
  }, [taskType])

  const fetchData = async () => {
    try {
      const [projectsRes, albumsRes] = await Promise.all([
        fetch('/api/projects?limit=100&includeAlbums=true'),
        fetch('/api/albums?limit=200')
      ])
      
      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data.projects || [])
      }
      
      if (albumsRes.ok) {
        const data = await albumsRes.json()
        setAlbums(data.albums || [])
      }
    } catch (error) {
      handleApiError(error, 'FetchData')
    } finally {
      setLoading(false)
    }
  }

  const fetchAlbumImages = async (albumId: string) => {
    try {
      const response = await fetch(`/api/albums/${albumId}/images`)
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      }
    } catch (error) {
      handleApiError(error, 'FetchImages')
    }
  }

  useEffect(() => {
    if (sourceType === 'album' && selectedAlbum) {
      fetchAlbumImages(selectedAlbum)
    } else if (sourceType === 'project' && selectedProject) {
      const project = projects.find(p => p.id === selectedProject)
      if (project && project.albums.length > 0) {
        fetchAlbumImages(project.albums[0].id)
      }
    }
  }, [sourceType, selectedAlbum, selectedProject])

  // OFFLINE_UPLOAD helpers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    const newFiles: UploadingFile[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending' as const,
      file
    }))
    
    setUploadingFiles(prev => [...prev, ...newFiles])
    
    // Extract folder name from first file's path (webkitRelativePath)
    if (uploadMode === 'folder' && files[0]) {
      const pathParts = (files[0] as any).webkitRelativePath?.split('/')
      if (pathParts && pathParts.length > 0) {
        const folderName = pathParts[0]
        setNewAlbumName(folderName)
      }
    }
  }

  const handleCloudConnect = async (provider: 'google-drive' | 'dropbox') => {
    setIsAuthenticating(true)
    try {
      const response = await fetch('/api/cloud/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.authUrl) {
          window.open(data.authUrl, '_blank', 'width=600,height=800')
        }
      } else {
        handleApiError(new Error('Failed to initiate authentication'), 'CloudAuth')
      }
    } catch (error) {
      handleApiError(error, 'CloudAuth')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const getTotalFileSize = (): string => {
    const total = uploadingFiles.reduce((sum, f) => sum + f.size, 0)
    return formatFileSize(total)
  }

  const canProceedOfflineUpload = (): boolean => {
    if (uploadingFiles.length === 0) return false
    if (uploadSource !== 'computer' && !cloudConnections.find(c => c.provider === uploadSource)?.connected) {
      return false
    }
    if (destinationType === 'project' && !destinationProjectId) return false
    if (destinationType === 'album' && !destinationAlbumId) return false
    if (uploadMode === 'folder' && !newAlbumName) return false
    return true
  }

  const handleSubmitOfflineUpload = async () => {
    setSubmitting(true)
    try {
      const project = projects.find(p => p.id === destinationProjectId)
      const album = albums.find(a => a.id === destinationAlbumId)
      
      const payload: Record<string, any> = {
        ...configValues,
        uploadSource,
        uploadMode,
        destinationType,
        destinationProjectId: destinationType === 'project' ? destinationProjectId : null,
        destinationAlbumId: destinationType === 'album' ? destinationAlbumId : null,
        newAlbumName: uploadMode === 'folder' ? newAlbumName : null,
        fileCount: uploadingFiles.length,
        totalSize: getTotalFileSize(),
        files: uploadingFiles.map(f => ({
          name: f.name,
          size: f.size
        }))
      }

      // Upload files to temp storage
      if (uploadSource === 'computer' && uploadingFiles.length > 0) {
        const formData = new FormData()
        uploadingFiles.forEach(f => {
          if (f.file) formData.append('files', f.file)
        })
        formData.append('destinationProjectId', destinationProjectId || '')
        formData.append('destinationAlbumId', destinationAlbumId || '')
        formData.append('newAlbumName', newAlbumName)
        formData.append('uploadMode', uploadMode)
        
        const uploadRes = await fetch('/api/upload/batch', {
          method: 'POST',
          body: formData
        })
        
        if (!uploadRes.ok) {
          throw new Error('Failed to upload files')
        }
        
        const uploadData = await uploadRes.json()
        payload.uploadedFiles = uploadData.files
      }

      const response = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: taskType,
          title: `Offline Upload: ${uploadingFiles.length} files`,
          description: `Upload ${uploadingFiles.length} files (${getTotalFileSize()}) to ${destinationType === 'project' ? project?.name : album?.name}`,
          priority: 'MEDIUM',
          payload
        })
      })

      if (response.ok) {
        showSuccess('Upload task created successfully')
        router.push('/admin/tasks')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create task')
      }
    } catch (error) {
      handleApiError(error, 'CreateTask')
    } finally {
      setSubmitting(false)
    }
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Unknown task type: {taskType}</p>
          <Link href="/admin/tasks" className="mt-4 inline-block text-primary hover:underline">
            Back to Tasks
          </Link>
        </div>
      </div>
    )
  }

  const Icon = config.icon

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        ...configValues,
        sourceType,
        sourceProjectId: sourceType === 'project' ? selectedProject : null,
        sourceAlbumId: sourceType === 'album' ? selectedAlbum : null,
        sourceImageIds: sourceType === 'images' ? selectedImages : [],
        destinationAlbumId: config.requiresDestination ? destinationAlbum : null
      }

      const response = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: taskType,
          title: config.label,
          description: generateDescription(payload),
          priority: 'MEDIUM',
          payload
        })
      })

      if (response.ok) {
        showSuccess('Task created successfully')
        router.push('/admin/tasks')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create task')
      }
    } catch (error) {
      handleApiError(error, 'CreateTask')
    } finally {
      setSubmitting(false)
    }
  }

  const generateDescription = (payload: Record<string, any>): string => {
    const parts: string[] = []
    
    if (payload.sourceProjectId) {
      const project = projects.find(p => p.id === payload.sourceProjectId)
      parts.push(`Project: ${project?.name || 'Unknown'}`)
    }
    if (payload.sourceAlbumId) {
      const album = albums.find(a => a.id === payload.sourceAlbumId)
      parts.push(`Album: ${album?.name || 'Unknown'}`)
    }
    if (payload.sourceImageIds?.length) {
      parts.push(`${payload.sourceImageIds.length} images`)
    }
    
    return parts.join(' → ')
  }

  const canProceed = () => {
    if (!config.requiresSource) return true
    
    switch (sourceType) {
      case 'project':
        return !!selectedProject
      case 'album':
        return !!selectedAlbum
      case 'images':
        return selectedImages.length > 0
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/tasks"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tasks
            </Link>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{config.label}</h1>
              <p className="text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : taskType === 'OFFLINE_UPLOAD' ? (
          <OfflineUploadUI
            projects={projects}
            albums={albums}
            uploadSource={uploadSource}
            setUploadSource={setUploadSource}
            uploadMode={uploadMode}
            setUploadMode={setUploadMode}
            destinationType={destinationType}
            setDestinationType={setDestinationType}
            destinationProjectId={destinationProjectId}
            setDestinationProjectId={setDestinationProjectId}
            destinationAlbumId={destinationAlbumId}
            setDestinationAlbumId={setDestinationAlbumId}
            newAlbumName={newAlbumName}
            setNewAlbumName={setNewAlbumName}
            uploadingFiles={uploadingFiles}
            setUploadingFiles={setUploadingFiles}
            cloudConnections={cloudConnections}
            setCloudConnections={setCloudConnections}
            isAuthenticating={isAuthenticating}
            fileInputRef={fileInputRef}
            folderInputRef={folderInputRef}
            handleFileSelect={handleFileSelect}
            handleCloudConnect={handleCloudConnect}
            removeFile={removeFile}
            formatFileSize={formatFileSize}
            getTotalFileSize={getTotalFileSize}
            canProceed={canProceedOfflineUpload}
            handleSubmit={handleSubmitOfflineUpload}
            submitting={submitting}
            configValues={configValues}
            setConfigValues={setConfigValues}
          />
        ) : (
          <div className="space-y-6">
            {/* Step 1: Source Selection */}
            {config.requiresSource && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">1</span>
                  Select Source
                </h2>

                {/* Source Type Selection */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {config.sourceTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setSourceType(type as any)}
                      className={`p-4 rounded-lg border transition-colors ${
                        sourceType === type
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {type === 'project' && <FolderOpen className="w-6 h-6 mx-auto mb-2 text-primary" />}
                      {type === 'album' && <Layers className="w-6 h-6 mx-auto mb-2 text-primary" />}
                      {type === 'images' && <ImageIcon className="w-6 h-6 mx-auto mb-2 text-primary" />}
                      <p className="text-sm font-medium capitalize">{type}</p>
                    </button>
                  ))}
                </div>

                {/* Project Selection */}
                {sourceType === 'project' && (
                  <div className="space-y-3">
                    {projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProject(project.id)}
                        className={`w-full p-4 rounded-lg border text-left transition-colors ${
                          selectedProject === project.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.albums?.length || 0} albums</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Album Selection */}
                {sourceType === 'album' && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {albums.map(album => (
                      <button
                        key={album.id}
                        onClick={() => setSelectedAlbum(album.id)}
                        className={`w-full p-4 rounded-lg border text-left transition-colors ${
                          selectedAlbum === album.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-medium">{album.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {album._count?.images || 0} images
                          {album.projectName && ` · ${album.projectName}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Image Selection */}
                {sourceType === 'images' && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      First select an album to choose images from:
                    </p>
                    <select
                      value={selectedAlbum}
                      onChange={(e) => setSelectedAlbum(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg mb-4"
                    >
                      <option value="">Select album...</option>
                      {albums.map(album => (
                        <option key={album.id} value={album.id}>{album.name}</option>
                      ))}
                    </select>

                    {images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                        {images.map(img => (
                          <button
                            key={img.id}
                            onClick={() => {
                              setSelectedImages(prev => 
                                prev.includes(img.id)
                                  ? prev.filter(id => id !== img.id)
                                  : [...prev, img.id]
                              )
                            }}
                            className={`aspect-square rounded-lg border-2 overflow-hidden relative ${
                              selectedImages.includes(img.id)
                                ? 'border-primary'
                                : 'border-border'
                            }`}
                          >
                            {img.thumbnailPath ? (
                              <img src={img.thumbnailPath} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            {selectedImages.includes(img.id) && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedImages.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedImages.length} image(s) selected
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Configuration */}
            {config.configOptions.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">
                    {config.requiresSource ? 2 : 1}
                  </span>
                  Configuration
                </h2>

                <div className="space-y-4">
                  {config.configOptions.map(opt => (
                    <div key={opt.name}>
                      <label className="block text-sm font-medium mb-2">{opt.label}</label>
                      
                      {opt.type === 'select' && (
                        <select
                          value={configValues[opt.name] || opt.default}
                          onChange={(e) => setConfigValues(prev => ({ ...prev, [opt.name]: e.target.value }))}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {opt.options?.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      )}
                      
                      {opt.type === 'number' && (
                        <input
                          type="number"
                          value={configValues[opt.name] || opt.default}
                          onChange={(e) => setConfigValues(prev => ({ ...prev, [opt.name]: parseInt(e.target.value) }))}
                          min={opt.min}
                          max={opt.max}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      )}
                      
                      {opt.type === 'toggle' && (
                        <button
                          onClick={() => setConfigValues(prev => ({ ...prev, [opt.name]: !prev[opt.name] }))}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            configValues[opt.name] ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            configValues[opt.name] ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary & Submit */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Summary</h2>
              
              <div className="space-y-2 text-sm mb-6">
                <p><span className="text-muted-foreground">Task:</span> {config.label}</p>
                {config.requiresSource && (
                  <p>
                    <span className="text-muted-foreground">Source:</span>{' '}
                    {sourceType === 'project' && projects.find(p => p.id === selectedProject)?.name}
                    {sourceType === 'album' && albums.find(a => a.id === selectedAlbum)?.name}
                    {sourceType === 'images' && `${selectedImages.length} images`}
                  </p>
                )}
                {config.configOptions.map(opt => (
                  <p key={opt.name}>
                    <span className="text-muted-foreground">{opt.label}:</span>{' '}
                    {opt.type === 'toggle' 
                      ? (configValues[opt.name] ? 'Yes' : 'No')
                      : configValues[opt.name]}
                  </p>
                ))}
              </div>

              <div className="flex gap-3">
                <Link
                  href="/admin/tasks"
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create Task
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
