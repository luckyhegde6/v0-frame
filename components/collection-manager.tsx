'use client'

import { useState } from 'react'
import { FolderPlus, Folder, ChevronRight } from 'lucide-react'

interface Collection {
  id: string
  name: string
  count: number
}

interface CollectionManagerProps {
  collections: Collection[]
  selectedCollection: string | null
  onSelectCollection: (id: string | null) => void
  onCreateCollection?: (name: string) => void
}

export function CollectionManager({
  collections,
  selectedCollection,
  onSelectCollection,
  onCreateCollection,
}: CollectionManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateCollection?.(newName)
      setNewName('')
      setIsCreating(false)
    }
  }

  return (
    <div className="w-full lg:w-64">
      <div className="space-y-2">
        {/* All Images */}
        <button
          onClick={() => onSelectCollection(null)}
          className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 font-medium ${selectedCollection === null
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'bg-card border border-border text-foreground hover:border-primary/50'
            }`}
        >
          <Folder size={20} />
          <span className="flex-1">All Images</span>
          <span className="text-sm opacity-60">{collections.reduce((sum, c) => sum + c.count, 0)}</span>
        </button>

        {/* Collections */}
        {collections.map(collection => (
          <button
            key={collection.id}
            onClick={() => onSelectCollection(collection.id)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 font-medium ${selectedCollection === collection.id
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-card border border-border text-foreground hover:border-primary/50'
              }`}
          >
            <Folder size={20} />
            <span className="flex-1">{collection.name}</span>
            <span className="text-sm opacity-60">{collection.count}</span>
          </button>
        ))}

        {/* Create New Collection */}
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full px-4 py-3 rounded-lg transition-all flex items-center gap-3 font-medium border border-dashed border-primary/50 text-foreground/60 hover:text-primary hover:border-primary"
          >
            <FolderPlus size={20} />
            <span>New Collection</span>
          </button>
        )}

        {/* Create Input */}
        {isCreating && (
          <div className="p-4 bg-card border border-primary/50 rounded-lg space-y-3">
            <input
              type="text"
              placeholder="Collection name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') {
                  setIsCreating(false)
                  setNewName('')
                }
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewName('')
                }}
                className="flex-1 px-3 py-2 border border-border text-foreground rounded-lg font-medium text-sm hover:bg-card transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
