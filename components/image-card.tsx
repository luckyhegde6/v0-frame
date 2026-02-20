'use client'

import { useState } from 'react'
import { MoreVertical, Download, Share2, Trash2, Copy, Cloud } from 'lucide-react'

interface ImageCardProps {
  id: string
  src: string
  title: string
  uploaded: string
  isSyncing?: boolean
  onClick?: () => void
  onDelete?: () => void
  size?: string
  dimensions?: string
  mimeType?: string
}

export function ImageCard({ id, src, title, uploaded, isSyncing, onClick, onDelete }: ImageCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="relative overflow-hidden rounded-lg border border-border group-hover:border-primary/50 transition-all bg-card">
        <img
          src={src || "/placeholder.svg"}
          alt={title}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
          <div className="flex justify-between items-start">
            {isSyncing ? (
              <div className="p-1.5 bg-primary/80 backdrop-blur-sm rounded-lg text-white" title="Syncing to home server...">
                <Cloud size={16} className="animate-pulse" />
              </div>
            ) : (
              <div />
            )}
            <div className="relative">
              <button
                onClick={e => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                className="p-1.5 bg-background/60 hover:bg-background rounded-lg transition-colors"
              >
                <MoreVertical size={16} />
              </button>
              {showMenu && (
                <div
                  className="absolute top-full right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 min-w-40"
                  onClick={e => e.stopPropagation()}
                >
                  <button className="w-full text-left px-3 py-2 hover:bg-primary/10 transition-colors flex items-center gap-2 text-sm rounded-t-lg">
                    <Download size={14} />
                    Download
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-primary/10 transition-colors flex items-center gap-2 text-sm">
                    <Share2 size={14} />
                    Share
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`frame.app/img/${id}`)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-primary/10 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Copy size={14} />
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      onDelete?.()
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-destructive/10 transition-colors flex items-center gap-2 text-sm text-destructive rounded-b-lg"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{title}</p>
            <p className="text-white/70 text-xs">{uploaded}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
