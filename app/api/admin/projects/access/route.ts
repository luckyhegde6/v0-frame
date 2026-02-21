import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { AccessLevel } from '@prisma/client'
import { logClientAccessGranted, logClientAccessRevoked, logClientAccessModified } from '@/lib/audit'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { projectId, accessList } = body

    if (!projectId || !Array.isArray(accessList)) {
      return NextResponse.json({ error: 'Project ID and access list are required' }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { accessList: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const existingAccess = project.accessList
    const existingMap = new Map(existingAccess.map(a => [a.userId, a]))
    const newMap = new Map(accessList.map((a: { userId: string; accessLevel: string }) => [a.userId, a]))

    const toAdd: { userId: string; accessLevel: AccessLevel }[] = []
    const toUpdate: { userId: string; oldLevel: AccessLevel; newLevel: AccessLevel }[] = []
    const toRemove: { userId: string; accessLevel: AccessLevel }[] = []

    for (const access of accessList) {
      const existing = existingMap.get(access.userId)
      if (!existing) {
        toAdd.push({ userId: access.userId, accessLevel: access.accessLevel as AccessLevel })
      } else if (existing.accessLevel !== access.accessLevel) {
        toUpdate.push({
          userId: access.userId,
          oldLevel: existing.accessLevel,
          newLevel: access.accessLevel as AccessLevel
        })
      }
    }

    for (const existing of existingAccess) {
      if (!newMap.has(existing.userId)) {
        toRemove.push({ userId: existing.userId, accessLevel: existing.accessLevel })
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const access of toRemove) {
        await tx.projectAccess.delete({
          where: { projectId_userId: { projectId, userId: access.userId } }
        })
        await logClientAccessRevoked(projectId, access.userId, session.user.id)
      }

      for (const access of toAdd) {
        await tx.projectAccess.create({
          data: {
            projectId,
            userId: access.userId,
            accessLevel: access.accessLevel
          }
        })
        await logClientAccessGranted(projectId, access.userId, access.accessLevel, session.user.id)
      }

      for (const update of toUpdate) {
        await tx.projectAccess.update({
          where: { projectId_userId: { projectId, userId: update.userId } },
          data: { accessLevel: update.newLevel }
        })
        await logClientAccessModified(projectId, update.userId, update.oldLevel, update.newLevel, session.user.id)
      }
    })

    return NextResponse.json({ 
      success: true,
      changes: {
        added: toAdd.length,
        updated: toUpdate.length,
        removed: toRemove.length
      }
    })
  } catch (error) {
    console.error('[AdminProjectAccessAPI] Error updating access:', error)
    return NextResponse.json({ error: 'Failed to update access' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { projectId, userEmail, accessLevel } = body

    if (!projectId || !userEmail || !accessLevel) {
      return NextResponse.json({ error: 'Project ID, user email, and access level are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existing = await prisma.projectAccess.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } }
    })

    if (existing) {
      await prisma.projectAccess.update({
        where: { projectId_userId: { projectId, userId: user.id } },
        data: { accessLevel: accessLevel as AccessLevel }
      })
      await logClientAccessModified(projectId, user.id, existing.accessLevel, accessLevel, session.user.id)
    } else {
      await prisma.projectAccess.create({
        data: { projectId, userId: user.id, accessLevel: accessLevel as AccessLevel }
      })
      await logClientAccessGranted(projectId, user.id, accessLevel, session.user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AdminProjectAccessAPI] Error adding access:', error)
    return NextResponse.json({ error: 'Failed to add access' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Project ID and user ID are required' }, { status: 400 })
    }

    await prisma.projectAccess.delete({
      where: { projectId_userId: { projectId, userId } }
    })

    await logClientAccessRevoked(projectId, userId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AdminProjectAccessAPI] Error removing access:', error)
    return NextResponse.json({ error: 'Failed to remove access' }, { status: 500 })
  }
}
