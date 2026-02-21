'use client'

import React, { useEffect, useState } from 'react'
import { getImageStatusLabel, pollImageStatus } from '@/lib/client-utils'

interface ImageUploadProgressProps {
  imageId: string
  onComplete?: (image: any) => void
  onError?: (error: Error) => void
}

/**
 * Phase 2: Image Upload Progress Component
 * Shows real-time progress as image is processed through job runner
 */
export function ImageUploadProgress({
  imageId,
  onComplete,
  onError
}: ImageUploadProgressProps) {
  const [image, setImage] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    if (!isPolling) return

    const handleProgress = (updatedImage: any) => {
      setImage(updatedImage)
      
      if (updatedImage.status === 'STORED') {
        setIsPolling(false)
        onComplete?.(updatedImage)
      } else if (updatedImage.status === 'FAILED') {
        setIsPolling(false)
        setError('Image processing failed')
        onError?.(new Error('Image processing failed'))
      }
    }

    const handleError = (err: Error) => {
      setIsPolling(false)
      setError(err.message)
      onError?.(err)
    }

    pollImageStatus(imageId, handleProgress).catch(handleError)
  }, [imageId, isPolling, onComplete, onError])

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 font-medium">Error</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  if (!image) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600 text-sm">Loading image status...</p>
      </div>
    )
  }

  const statusLabel = getImageStatusLabel(image.status)
  const isComplete = image.status === 'STORED'
  
  const steps = [
    { label: 'Upload', completed: image.status !== 'UPLOADED' },
    { label: 'Ingest', completed: image.status !== 'UPLOADED' && image.status !== 'INGESTED' },
    { label: 'Process', completed: image.status === 'PROCESSING' || image.status === 'STORED' },
    { label: 'Store', completed: image.status === 'STORED' }
  ]

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="mb-3">
        <p className="text-sm font-medium text-blue-900">
          {statusLabel}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          {image.title || 'Image'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-3">
        {steps.map((step, idx) => (
          <React.Fragment key={step.label}>
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                step.completed
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {step.completed ? '✓' : idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-1 ${
                  step.completed ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between text-xs text-blue-700">
        {steps.map(step => (
          <span key={step.label}>{step.label}</span>
        ))}
      </div>

      {/* Status Details */}
      {image.processingJobs && image.processingJobs.length > 0 && (
        <div className="mt-3 text-xs text-blue-700 space-y-1">
          <p className="font-medium">Active jobs:</p>
          <ul className="list-disc list-inside">
            {image.processingJobs.map((job: any) => (
              <li key={job.id}>{job.type}</li>
            ))}
          </ul>
        </div>
      )}

      {isComplete && (
        <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded text-xs text-green-800">
          ✓ Image is ready! Thumbnail and preview have been generated.
        </div>
      )}
    </div>
  )
}

export default ImageUploadProgress
