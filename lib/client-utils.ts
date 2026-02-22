// Frontend Utilities
// Helper functions for interacting with APIs from client components

const API_BASE = typeof window === 'undefined' ? 
  process.env.API_BASE || 'http://localhost:3000' : 
  ''

/**
 * Fetch images with status information
 */
export async function getImages() {
  try {
    const response = await fetch(`${API_BASE}/api/images`)
    if (!response.ok) throw new Error('Failed to fetch images')
    return await response.json()
  } catch (error) {
    console.error('[getImages]', error)
    throw error
  }
}

/**
 * Get the public URL for a derived asset
 */
export function getAssetUrl(relativePath: string): string {
  if (!relativePath) return ''
  
  const urlPath = relativePath
    .replace(/^\/tmp\/storage\//, '/storage/')
  
  return urlPath
}

/**
 * Get thumbnail URL for an image
 */
export function getThumbnailUrl(image: any): string | null {
  if (!image?.thumbnailPath) return null
  return getAssetUrl(image.thumbnailPath)
}

/**
 * Get preview URL for an image
 */
export function getPreviewUrl(image: any): string | null {
  if (!image?.previewPath) return null
  return getAssetUrl(image.previewPath)
}

/**
 * Check if an image is ready for display
 */
export function isImageReady(image: any): boolean {
  return image?.status === 'STORED' && !!image?.previewPath
}

/**
 * Get human-readable status for an image
 */
export function getImageStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    UPLOADED: 'Uploading',
    INGESTED: 'Processing',
    PROCESSING: 'Generating assets',
    STORED: 'Ready',
    FAILED: 'Failed'
  }
  return labels[status] || 'Unknown'
}

/**
 * Get admin job list with optional filters
 */
export async function getJobs(filters?: {
  status?: string
  type?: string
  imageId?: string
  limit?: number
  offset?: number
}) {
  try {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.imageId) params.append('imageId', filters.imageId)
    if (filters?.limit) params.append('limit', String(filters.limit))
    if (filters?.offset) params.append('offset', String(filters.offset))

    const response = await fetch(`${API_BASE}/api/admin/jobs?${params}`)
    if (!response.ok) throw new Error('Failed to fetch jobs')
    return await response.json()
  } catch (error) {
    console.error('[getJobs]', error)
    throw error
  }
}

/**
 * Get details for a specific job
 */
export async function getJob(jobId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/jobs/${jobId}`)
    if (!response.ok) throw new Error('Failed to fetch job')
    return await response.json()
  } catch (error) {
    console.error('[getJob]', error)
    throw error
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Format date to human-readable format
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Debounce function for API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Poll for image status changes
 */
export async function pollImageStatus(
  imageId: string,
  callback: (image: any) => void,
  intervalMs: number = 2000,
  maxAttempts: number = 30
): Promise<void> {
  let attempts = 0

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const { data: images } = await getImages()
        const image = images.find((img: any) => img.id === imageId)

        if (!image) {
          reject(new Error('Image not found'))
          return
        }

        callback(image)

        if (image.status === 'STORED' || image.status === 'FAILED') {
          resolve()
          return
        }

        attempts++
        if (attempts >= maxAttempts) {
          reject(new Error('Polling timeout'))
          return
        }

        setTimeout(poll, intervalMs)
      } catch (error) {
        reject(error)
      }
    }

    poll()
  })
}
