'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Users, Shield, Crown, User, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { handleApiError } from '@/lib/error-handler'

interface UserData {
  id: string
  name: string | null
  email: string | null
  role: string
  imageCount: number
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      handleApiError(error, 'FetchUsers')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchUsers()
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-red-500" />
      default:
        return <User className="w-4 h-4 text-blue-500" />
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'ADMIN':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'PRO':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'CLIENT':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

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
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Users Management</h1>
              <p className="text-muted-foreground">Manage user accounts and roles</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Images</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{user.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.imageCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
