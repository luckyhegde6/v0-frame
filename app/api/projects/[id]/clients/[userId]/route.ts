import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logClientAccessRevoked } from '@/lib/audit'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth()
    const { id, userId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'

    const project = await prisma.project.findFirst({
      where: { 
        id,
        ...(isAdmin ? {} : { ownerId: session.user.id })
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const access = await prisma.clientProjectAccess.findFirst({
      where: {
        projectId: id,
        userId
      }
    })

    if (!access) {
      return NextResponse.json({ error: 'Access not found' }, { status: 404 })
    }

    await prisma.clientProjectAccess.delete({
      where: { id: access.id }
    })

    await logClientAccessRevoked(id, userId, session.user.id, { projectName: project.name })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ClientAccessAPI] Failed to revoke access:', error)
    return NextResponse.json(
      { error: 'Failed to revoke access' },
      { status: 500 }
    )
  }
}
