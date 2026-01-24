'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface GallerySearchProps {
  onSearch: (query: string) => void
  onFilterChange: (filter: 'all' | 'recent' | 'favorites') => void
  currentFilter: string
}

export function GallerySearch({ onSearch, onFilterChange, currentFilter }: GallerySearchProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleClear = () => {
    setSearchQuery('')
    onSearch('')
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
        <input
          type="text"
          placeholder="Search your gallery..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          className="w-full pl-12 pr-10 py-3 bg-card border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'recent', 'favorites'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentFilter === filter
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-card border border-border text-foreground/60 hover:text-foreground'
            }`}
          >
            {filter === 'all' ? 'All Images' : filter === 'recent' ? 'Recently Added' : 'Favorites'}
          </button>
        ))}
      </div>
    </div>
  )
}
