import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    redirect('/gallery')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6 py-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
