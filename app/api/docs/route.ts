import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { swaggerSpec } from '@/lib/swagger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    )
  }

  return NextResponse.json(swaggerSpec, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
