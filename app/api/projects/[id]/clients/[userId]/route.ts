import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

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

    const project = await prisma.project.findFirst({
      where: { 
        id,
        ownerId: session.user.id 
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ClientAccessAPI] Failed to revoke access:', error)
    return NextResponse.json(
      { error: 'Failed to revoke access' },
      { status: 500 }
    )
  }
}
