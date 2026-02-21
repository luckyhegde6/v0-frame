import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import ApiDocsClient from './client'

export default async function ApiDocsPage() {
  const session = await auth()

  if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    redirect('/gallery')
  }

  return <ApiDocsClient />
}
