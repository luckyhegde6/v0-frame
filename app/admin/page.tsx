import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { Shield, Users, Settings, Activity } from 'lucide-react'

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/gallery')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold text-green-500">OK</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admin Role</p>
                <p className="text-2xl font-bold">Active</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Users</h3>
            <p className="text-muted-foreground">Manage user accounts and roles</p>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Jobs</h3>
            <p className="text-muted-foreground">Monitor background job processing</p>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">System</h3>
            <p className="text-muted-foreground">View system health and metrics</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-card border border-border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Current User</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {session.user.name}</p>
            <p><span className="text-muted-foreground">Email:</span> {session.user.email}</p>
            <p><span className="text-muted-foreground">Role:</span> <span className="text-primary font-medium">{session.user.role}</span></p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <a
              href="/api/admin/jobs"
              className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              View Jobs API
            </a>
            <a
              href="/gallery"
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Back to Gallery
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
