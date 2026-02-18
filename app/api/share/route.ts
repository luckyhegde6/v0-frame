import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (token) {
    try {
      const shareToken = await prisma.shareToken.findUnique({
        where: { token },
        include: {
          project: {
            include: {
              images: {
                include: { image: true },
                take: 100
              }
            }
          }
        }
      })

      if (!shareToken) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
      }

      if (shareToken.expiresAt && shareToken.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Token expired' }, { status: 410 })
      }

      if (shareToken.maxAccesses && shareToken.accessCount >= shareToken.maxAccesses) {
        return NextResponse.json({ error: 'Access limit reached' }, { status: 403 })
      }

      await prisma.shareToken.update({
        where: { id: shareToken.id },
        data: { accessCount: { increment: 1 } }
      })

      return NextResponse.json({
        project: {
          id: shareToken.project.id,
          name: shareToken.project.name,
          description: shareToken.project.description,
          images: shareToken.project.images.map(pi => ({
            id: pi.image.id,
            title: pi.image.title,
            width: pi.image.width,
            height: pi.image.height,
            thumbnailPath: pi.image.thumbnailPath,
            previewPath: pi.image.previewPath
          }))
        }
      })
    } catch (error) {
      console.error('Share access error:', error)
      return NextResponse.json({ error: 'Failed to access share' }, { status: 500 })
    }
  }

  try {
    const shares = await prisma.shareToken.findMany({
      where: {
        OR: [
          { createdById: session.user.id },
          { project: { ownerId: session.user.id } }
        ]
      },
      include: {
        project: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const serializedShares = shares.map(share => ({
      id: share.id,
      token: share.token,
      projectId: share.projectId,
      projectName: share.project?.name,
      expiresAt: share.expiresAt?.toISOString() || null,
      maxAccesses: share.maxAccesses,
      accessCount: share.accessCount,
      createdById: share.createdById,
      createdAt: share.createdAt.toISOString()
    }))

    return NextResponse.json({ shares: serializedShares })
  } catch (error) {
    console.error('Failed to fetch shares:', error)
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { projectId, expiresAt, maxAccesses } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    const token = crypto.randomBytes(32).toString('hex')

    const shareToken = await prisma.shareToken.create({
      data: {
        token,
        projectId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxAccesses: maxAccesses || null,
        createdById: session.user.id
      },
      include: {
        project: true
      }
    })

    return NextResponse.json({
      share: {
        id: shareToken.id,
        token: shareToken.token,
        projectId: shareToken.projectId,
        projectName: shareToken.project.name,
        expiresAt: shareToken.expiresAt?.toISOString(),
        maxAccesses: shareToken.maxAccesses,
        accessCount: shareToken.accessCount,
        createdAt: shareToken.createdAt.toISOString()
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create share:', error)
    return NextResponse.json({ error: 'Failed to create share' }, { status: 500 })
  }
}
