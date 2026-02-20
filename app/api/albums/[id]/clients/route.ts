import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { isAdmin } from '@/lib/auth/access'
import { logAuditEvent } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const album = await prisma.album.findUnique({
      where: { id },
      select: { ownerId: true, projectId: true }
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

    const clientAccess = await prisma.clientAlbumAccess.findMany({
      where: { albumId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      clients: clientAccess.map(access => ({
        id: access.id,
        userId: access.userId,
        userName: access.user.name,
        userEmail: access.user.email,
        userRole: access.user.role,
        accessLevel: access.accessLevel,
        grantedAt: access.createdAt.toISOString(),
        grantedById: access.grantedById
      }))
    })
  } catch (error) {
    console.error('[AlbumClientsAPI] Failed to fetch album clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch album clients' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, accessLevel = 'READ' } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
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

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existing = await prisma.clientAlbumAccess.findUnique({
      where: {
        albumId_userId: { albumId: id, userId }
      }
    })

    if (existing) {
      const updated = await prisma.clientAlbumAccess.update({
        where: { id: existing.id },
        data: { accessLevel },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      await logAuditEvent({
        action: 'CLIENT_ACCESS_MODIFIED',
        entityType: 'Album',
        entityId: id,
        userId: session.user.id,
        metadata: { 
          targetUserId: userId, 
          targetUserEmail: targetUser.email,
          accessLevel,
          albumName: album.name
        },
        oldValue: { accessLevel: existing.accessLevel },
        newValue: { accessLevel }
      })

      return NextResponse.json({
        success: true,
        action: 'updated',
        access: {
          id: updated.id,
          userId: updated.userId,
          userName: updated.user.name,
          userEmail: updated.user.email,
          accessLevel: updated.accessLevel
        }
      })
    }

    const access = await prisma.clientAlbumAccess.create({
      data: {
        albumId: id,
        userId,
        accessLevel,
        grantedById: session.user.id
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    await logAuditEvent({
      action: 'CLIENT_ACCESS_GRANTED',
      entityType: 'Album',
      entityId: id,
      userId: session.user.id,
      metadata: { 
        targetUserId: userId, 
        targetUserEmail: targetUser.email,
        accessLevel,
        albumName: album.name
      }
    })

    return NextResponse.json({
      success: true,
      action: 'created',
      access: {
        id: access.id,
        userId: access.userId,
        userName: access.user.name,
        userEmail: access.user.email,
        accessLevel: access.accessLevel
      }
    })
  } catch (error) {
    console.error('[AlbumClientsAPI] Failed to grant album access:', error)
    return NextResponse.json(
      { error: 'Failed to grant album access' },
      { status: 500 }
    )
  }
}
