import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default async function SwaggerPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    redirect('/gallery')
  }

  return (
    <div className="swagger-container">
      <SwaggerUI url="/api/docs" />
    </div>
  )
}
