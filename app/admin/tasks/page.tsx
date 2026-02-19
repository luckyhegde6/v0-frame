'use client'

import { useEffect, useState } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  ArrowLeft, 
  RefreshCw, 
  Loader2, 
  Plus,
  X,
  Zap,
  Archive,
  Upload,
  RefreshCw as SyncIcon,
  Image as ImageIcon,
  Database,
  Trash,
  HardDrive,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Settings,
  UserPlus,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'
import { handleApiError, showSuccess } from '@/lib/error-handler'

interface Task {
  id: string
  type: string
  status: string
  priority: string
  progress: number
  title: string
  description: string | null
  error: string | null
  payload: Record<string, unknown> | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  createdBy: {
    id: string
    name: string | null
    email: string
  } | null
}

const TASK_TYPES = [
  { value: 'COMPRESS_IMAGES', label: 'Compress Images', icon: Zap, description: 'Compress existing images to save storage' },
  { value: 'EXTRACT_ARCHIVE', label: 'Extract Archive', icon: Archive, description: 'Extract uploaded ZIP/TAR archives' },
  { value: 'OFFLINE_UPLOAD', label: 'Offline Upload', icon: Upload, description: 'Batch upload from offline storage' },
  { value: 'SYNC_STORAGE', label: 'Sync Storage', icon: SyncIcon, description: 'Sync storage with cloud providers' },
  { value: 'GENERATE_THUMBNAILS', label: 'Generate Thumbnails', icon: ImageIcon, description: 'Regenerate missing thumbnails' },
  { value: 'REGENERATE_METADATA', label: 'Regenerate Metadata', icon: Settings, description: 'Re-extract EXIF metadata' },
  { value: 'BACKUP_DATABASE', label: 'Backup Database', icon: Database, description: 'Create database backup' },
  { value: 'CLEANUP_TEMP', label: 'Cleanup Temp', icon: Trash, description: 'Clean up temporary files' },
  { value: 'OPTIMIZE_STORAGE', label: 'Optimize Storage', icon: HardDrive, description: 'Optimize storage allocation' },
  { value: 'SYNC_USERS', label: 'Sync Users', icon: Users, description: 'Sync user data with external sources' }
]

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'text-gray-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-blue-500' },
  { value: 'HIGH', label: 'High', color: 'text-yellow-500' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-500' }
]

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [newTask, setNewTask] = useState({
    type: 'COMPRESS_IMAGES',
    title: '',
    description: '',
    priority: 'MEDIUM'
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [filter])

  const fetchTasks = async () => {
    try {
      const url = filter !== 'all' 
        ? `/api/admin/tasks?status=${filter}&limit=100` 
        : '/api/admin/tasks?limit=100'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      handleApiError(error, 'FetchTasks')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewTask({
          type: 'COMPRESS_IMAGES',
          title: '',
          description: '',
          priority: 'MEDIUM'
        })
        fetchTasks()
      }
    } catch (error) {
      handleApiError(error, 'CreateTask')
    } finally {
      setCreating(false)
    }
  }

  const handleCancelTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/admin/tasks?id=${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTasks()
      }
    } catch (error) {
      handleApiError(error, 'CancelTask')
    }
  }

  const handleTaskAction = async (taskId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        showSuccess(`Task ${action}d`)
        fetchTasks()
      }
    } catch (error) {
      handleApiError(error, 'TaskAction')
    }
  }

  const handleAssignToSelf = async (taskId: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign' })
      })

      if (response.ok) {
        showSuccess('Task assigned to you')
        fetchTasks()
      }
    } catch (error) {
      handleApiError(error, 'AssignTask')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess('Task deleted')
        fetchTasks()
      }
    } catch (error) {
      handleApiError(error, 'DeleteTask')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'RUNNING':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-gray-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getTaskTypeInfo = (type: string) => {
    return TASK_TYPES.find(t => t.value === type) || { label: type, icon: Settings }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Play className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tasks Panel</h1>
              <p className="text-muted-foreground">Manage background tasks and operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
            <button
              onClick={fetchTasks}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Task Type Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {TASK_TYPES.slice(0, 5).map(taskType => {
            const Icon = taskType.icon
            return (
              <button
                key={taskType.value}
                onClick={() => {
                  setNewTask({
                    ...newTask,
                    type: taskType.value,
                    title: taskType.label
                  })
                  setShowCreateModal(true)
                }}
                className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors text-left"
              >
                <Icon className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium text-sm">{taskType.label}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-4">
          {['all', 'PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === status 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No tasks found
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const TaskIcon = getTaskTypeInfo(task.type).icon
              const priorityInfo = PRIORITIES.find(p => p.value === task.priority)
              const isShareRequest = task.type === 'SHARE_REQUEST'
              
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TaskIcon className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{task.title}</p>
                      <span className={`text-xs ${priorityInfo?.color}`}>
                        {priorityInfo?.label}
                      </span>
                      {isShareRequest && task.payload && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Share Request
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{task.type}</span>
                      <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                      {task.createdBy && (
                        <span>Assigned to: {task.createdBy.email}</span>
                      )}
                    </div>
                    {isShareRequest && task.payload && (
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="text-muted-foreground">Project: {(task.payload as Record<string, unknown>).projectName as string}</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-muted-foreground">Requested by: {(task.payload as Record<string, unknown>).requestedByEmail as string}</span>
                      </div>
                    )}
                  </div>

                  {task.status === 'RUNNING' && (
                    <div className="w-32">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {getStatusIcon(task.status)}
                    
                    {/* Action Buttons */}
                    {task.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleAssignToSelf(task.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary"
                          title="Assign to me"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        {isShareRequest && task.payload && (
                          <Link
                            href={`/projects/${(task.payload as Record<string, unknown>).projectId}?tab=settings`}
                            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary"
                            title="Go to project settings"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    {task.status === 'QUEUED' && (
                      <>
                        <button
                          onClick={() => handleTaskAction(task.id, 'start')}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-green-500"
                          title="Start task"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTaskAction(task.id, 'reset')}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-yellow-500"
                          title="Reset to pending"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    {task.status === 'RUNNING' && (
                      <>
                        <button
                          onClick={() => handleTaskAction(task.id, 'complete')}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-green-500"
                          title="Mark complete"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTaskAction(task.id, 'fail')}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-red-500"
                          title="Mark failed"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    {task.status === 'FAILED' && (
                      <>
                        <button
                          onClick={() => handleTaskAction(task.id, 'reset')}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-yellow-500"
                          title="Retry task"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    {task.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    {task.status === 'CANCELLED' && (
                      <>
                        <button
                          onClick={() => handleTaskAction(task.id, 'reset')}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-yellow-500"
                          title="Reset task"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-card border border-border rounded-lg w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create New Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Task Type</label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value, title: TASK_TYPES.find(t => t.value === e.target.value)?.label || '' })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {TASK_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {TASK_TYPES.find(t => t.value === newTask.type)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {PRIORITIES.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTask.title}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
