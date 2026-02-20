import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { isAdmin } from '@/lib/auth/access'
import { logAuditEvent } from '@/lib/audit'

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

    const album = await prisma.album.findUnique({
      where: { id },
      select: { ownerId: true, projectId: true, name: true }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const isOwner = album.ownerId === session.user.id
    const isAdminUser = isAdmin(session.user.role)
    
    if (!isOwner && !isAdminUser) {
      if (album.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: album.projectId },
          select: { ownerId: true }
        })
        if (!project || project.ownerId !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const access = await prisma.clientAlbumAccess.findUnique({
      where: {
        albumId_userId: { albumId: id, userId }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!access) {
      return NextResponse.json({ error: 'Access not found' }, { status: 404 })
    }

    await prisma.clientAlbumAccess.delete({
      where: { id: access.id }
    })

    await logAuditEvent({
      action: 'CLIENT_ACCESS_REVOKED',
      entityType: 'Album',
      entityId: id,
      userId: session.user.id,
      metadata: { 
        targetUserId: userId, 
        targetUserEmail: access.user.email,
        albumName: album.name
      }
    })

    return NextResponse.json({
      success: true,
      message: `Access revoked for ${access.user.email}`
    })
  } catch (error) {
    console.error('[AlbumClientAPI] Failed to revoke album access:', error)
    return NextResponse.json(
      { error: 'Failed to revoke album access' },
      { status: 500 }
    )
  }
}
