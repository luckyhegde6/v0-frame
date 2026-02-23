import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Shield, Users, Settings, Activity, FolderOpen, Play, BookOpen, HardDrive, FileText, Clock, AlertCircle, CheckCircle, XCircle, Ban, Bell, ListChecks, Key, KeyRound, Grid3X3, Tags, ScanFace } from 'lucide-react'
import Link from 'next/link'
import { QuickActions } from './components/quick-actions'

async function getStats() {
  const [
    totalUsers, 
    totalImages, 
    totalJobs, 
    jobsPending, 
    jobsRunning,
    jobsFailed,
    jobsCompleted,
    jobsCancelled,
    totalProjects,
    totalAlbums,
    unreadNotifications,
    recentErrors,
    requestsPending,
    requestsInProgress,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.image.count(),
    prisma.job.count(),
    prisma.job.count({ where: { status: 'PENDING' } }),
    prisma.job.count({ where: { status: 'RUNNING' } }),
    prisma.job.count({ where: { status: 'FAILED' } }),
    prisma.job.count({ where: { status: 'COMPLETED' } }),
    prisma.job.count({ where: { status: 'CANCELLED' } }),
    prisma.project.count(),
    prisma.album.count(),
    prisma.notification.count({ where: { status: 'UNREAD' } }),
    prisma.job.count({ 
      where: { 
        status: 'FAILED',
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      } 
    }),
    prisma.proRequest.count({ where: { status: 'PENDING' } }),
    prisma.proRequest.count({ where: { status: 'IN_PROGRESS' } }),
  ])
  
  return {
    totalUsers,
    totalImages,
    totalJobs,
    activeJobs: jobsPending + jobsRunning,
    jobsPending,
    jobsRunning,
    jobsFailed,
    jobsCompleted,
    jobsCancelled,
    totalProjects,
    totalAlbums,
    unreadNotifications,
    recentErrors,
    activeRequests: requestsPending + requestsInProgress,
    requestsPending,
    requestsInProgress,
  }
}

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    redirect('/gallery')
  }

  const stats = await getStats()

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Albums</p>
                <p className="text-2xl font-bold">{stats.totalAlbums}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Images</p>
                <p className="text-2xl font-bold">{stats.totalImages}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold">{stats.activeJobs}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Errors (24h)</p>
                <p className="text-2xl font-bold">{stats.recentErrors}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Requests</p>
                <p className="text-2xl font-bold">{stats.activeRequests}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-yellow-500">Pending: {stats.jobsPending}</span>
          </div>
          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
            <span className="text-sm text-blue-500">Running: {stats.jobsRunning}</span>
          </div>
          <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500">Completed: {stats.jobsCompleted}</span>
          </div>
          <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-500">Failed: {stats.jobsFailed}</span>
          </div>
          <div className="p-3 bg-gray-500/5 border border-gray-500/20 rounded-lg flex items-center gap-2">
            <Ban className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">Cancelled: {stats.jobsCancelled}</span>
          </div>
        </div>

        {stats.unreadNotifications > 0 && (
          <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-orange-500" />
              <span className="text-orange-500 font-medium">{stats.unreadNotifications} unread notifications</span>
            </div>
            <Link href="/admin/notifications" className="text-sm text-orange-500 hover:underline">
              View all
            </Link>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Link href="/admin/users" className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Users</h3>
            <p className="text-muted-foreground text-sm">Manage user accounts and roles</p>
          </Link>

          <Link href="/admin/gallery" className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <FolderOpen className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Gallery</h3>
            <p className="text-muted-foreground text-sm">Browse user galleries</p>
          </Link>

          <Link href="/admin/tasks" className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <Play className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tasks</h3>
            <p className="text-muted-foreground text-sm">Run background tasks</p>
          </Link>

          <Link href="/admin/jobs" className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Jobs</h3>
            <p className="text-muted-foreground text-sm">Monitor background job processing</p>
          </Link>

          <Link href="/admin/system" className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">System</h3>
            <p className="text-muted-foreground text-sm">View system health and metrics</p>
          </Link>

          <Link href="/admin/storage" className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
              <HardDrive className="w-6 h-6 text-cyan-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Storage</h3>
            <p className="text-muted-foreground text-sm">Monitor storage usage and files</p>
          </Link>

          <Link href="/admin/audit" className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Audit Log</h3>
            <p className="text-muted-foreground text-sm">View system activity logs</p>
          </Link>

          <Link href="/admin/api-docs" className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">API Docs</h3>
            <p className="text-muted-foreground text-sm">Swagger documentation</p>
          </Link>

          <Link href="/admin/requests" className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <ListChecks className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">PRO Requests</h3>
            <p className="text-muted-foreground text-sm">Track user requests</p>
          </Link>

          <Link href="/admin/password-resets" className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Password Resets</h3>
            <p className="text-muted-foreground text-sm">Manage password resets</p>
          </Link>

          <Link href="/admin/faces" className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4">
              <ScanFace className="w-6 h-6 text-pink-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Faces</h3>
            <p className="text-muted-foreground text-sm">Manage detected faces</p>
          </Link>

          <Link href="/admin/tiles" className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-4">
              <Grid3X3 className="w-6 h-6 text-teal-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tiles</h3>
            <p className="text-muted-foreground text-sm">Manage dashboard tiles</p>
          </Link>

          <Link href="/admin/classifications" className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
              <Tags className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Classifications</h3>
            <p className="text-muted-foreground text-sm">Manage image classifications</p>
          </Link>
        </div>

        <div className="mt-8 p-6 bg-card border border-border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Current User</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {session.user.name}</p>
            <p><span className="text-muted-foreground">Email:</span> {session.user.email}</p>
            <p><span className="text-muted-foreground">Role:</span> <span className="text-primary font-medium">{session.user.role}</span></p>
          </div>
        </div>

        <QuickActions unreadNotifications={stats.unreadNotifications} />
      </main>
    </div>
  )
}
