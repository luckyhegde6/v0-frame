'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Tags, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Loader2,
  Tag,
  Folder
} from 'lucide-react'
import { handleApiError } from '@/lib/error-handler'

interface Classification {
  id: string
  name: string
  category: string
  description: string | null
  color: string
  icon: string | null
  parentId: string | null
  isActive: boolean
  createdAt: string
}

export default function ClassificationsPage() {
  const [classifications, setClassifications] = useState<Classification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingClassification, setEditingClassification] = useState<Classification | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    description: '',
    color: '#00D9FF',
    icon: 'tag'
  })

  useEffect(() => {
    fetchClassifications()
  }, [])

  const fetchClassifications = async () => {
    try {
      const response = await fetch('/api/admin/classifications')
      if (response.ok) {
        const data = await response.json()
        setClassifications(data.classifications || [])
      }
    } catch (error) {
      handleApiError(error, 'FetchClassifications')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingClassification ? `/api/admin/classifications/${editingClassification.id}` : '/api/admin/classifications'
      const method = editingClassification ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowModal(false)
        setEditingClassification(null)
        setFormData({ name: '', category: 'general', description: '', color: '#00D9FF', icon: 'tag' })
        fetchClassifications()
      }
    } catch (error) {
      handleApiError(error, 'SaveClassification')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classification?')) return

    try {
      const response = await fetch(`/api/admin/classifications/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchClassifications()
      }
    } catch (error) {
      handleApiError(error, 'DeleteClassification')
    }
  }

  const openEdit = (classification: Classification) => {
    setEditingClassification(classification)
    setFormData({
      name: classification.name,
      category: classification.category,
      description: classification.description || '',
      color: classification.color,
      icon: classification.icon || 'tag'
    })
    setShowModal(true)
  }

  const openNew = () => {
    setEditingClassification(null)
    setFormData({ name: '', category: 'general', description: '', color: '#00D9FF', icon: 'tag' })
    setShowModal(true)
  }

  const categories = [...new Set(classifications.map(c => c.category))]
  
  const filteredClassifications = classifications.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </Link>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Tags className="w-6 h-6" />
                Classification Management
              </h1>
              <p className="text-muted-foreground">
                Manage image classifications and categories
              </p>
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Add Classification
            </button>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search classifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredClassifications.length === 0 ? (
          <div className="text-center py-12">
            <Tags className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Classifications Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Create your first classification to get started'}
            </p>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Add Classification
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClassifications.map(classification => (
              <div
                key={classification.id}
                className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${classification.color}20` }}
                    >
                      <Tag className="w-5 h-5" style={{ color: classification.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{classification.name}</h3>
                      <p className="text-xs text-muted-foreground">{classification.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(classification)}
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(classification.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {classification.description && (
                  <p className="text-sm text-muted-foreground mb-2">{classification.description}</p>
                )}
                <div 
                  className="w-full h-2 rounded-full"
                  style={{ backgroundColor: classification.color }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingClassification ? 'Edit Classification' : 'Add New Classification'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Classification name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="general">General</option>
                  <option value="object">Object</option>
                  <option value="scene">Scene</option>
                  <option value="people">People</option>
                  <option value="event">Event</option>
                  <option value="location">Location</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="#00D9FF"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                {editingClassification ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
