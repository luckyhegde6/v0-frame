import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import AllTasksClient from './client'

export default async function AllTasksPage() {
  const session = await auth()

  if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    redirect('/gallery')
  }

  return <AllTasksClient />
}
