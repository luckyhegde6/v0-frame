import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import TaskConfigClient from './client'

export default async function TaskConfigPage({ 
  params 
}: { 
  params: Promise<{ type: string }> 
}) {
  const session = await auth()

  if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    redirect('/gallery')
  }

  const { type } = await params

  return <TaskConfigClient taskType={type} />
}
