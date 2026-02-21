import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'
import { logProRequestSubmitted, logProjectExportRequested } from '@/lib/audit'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requests = await prisma.proRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        project: { select: { id: true, name: true } },
        album: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Failed to fetch requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || (user.role !== Role.PRO && user.role !== Role.ADMIN && user.role !== Role.SUPERADMIN)) {
      return NextResponse.json(
        { error: 'PRO subscription required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type, title, description, payload } = body

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Type and title are required' },
        { status: 400 }
      )
    }

    const validTypes = [
      'PROJECT_EXPORT_REQUEST',
      'THUMBNAIL_REGENERATION',
      'FACE_RECOGNITION',
      'WATERMARK_ENABLE',
      'SHARE_REQUEST'
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      )
    }

    const projectId = payload?.projectId as string | undefined
    const albumId = payload?.albumId as string | undefined

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: session.user.id }
      })
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }
    }

    if (albumId) {
      const album = await prisma.album.findFirst({
        where: { id: albumId, ownerId: session.user.id }
      })
      if (!album) {
        return NextResponse.json(
          { error: 'Album not found' },
          { status: 404 }
        )
      }
    }

    const proRequest = await prisma.proRequest.create({
      data: {
        type,
        title,
        description: description || null,
        payload: payload || null,
        userId: session.user.id,
        projectId: projectId || null,
        albumId: albumId || null
      }
    })

    await prisma.notification.create({
      data: {
        type: 'ACCESS_REQUEST',
        title: 'New PRO Request',
        message: `${session.user.name || session.user.email} submitted a request: ${title}`,
        requestor: session.user.email || undefined,
        userId: null,
        status: 'UNREAD',
        read: false
      }
    })

    await logProRequestSubmitted(proRequest.id, session.user.id, type, {
      title,
      projectId,
      albumId
    })

    if (type === 'PROJECT_EXPORT_REQUEST' && projectId) {
      await logProjectExportRequested(projectId, session.user.id, {
        requestId: proRequest.id
      })
    }

    return NextResponse.json({ request: proRequest }, { status: 201 })
  } catch (error) {
    console.error('Failed to create request:', error)
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}
