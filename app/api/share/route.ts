import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth/auth'

export async function GET(request: NextRequest) {
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

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      
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
            thumbnailPath: pi.image.thumbnailPath ? `${baseUrl}/api/images/${pi.image.id}/file?type=thumbnail&size=512` : null,
            previewPath: pi.image.previewPath ? `${baseUrl}/api/images/${pi.image.id}/file?type=preview` : null
          }))
        }
      })
    } catch (error) {
      console.error('Share access error:', error)
      return NextResponse.json({ error: 'Failed to access share' }, { status: 500 })
    }
  }

  // For listing shares, require authentication
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // ADMIN/SUPERADMIN can generate links for any project
    // Others can only generate for their own projects
    const isAdminUser = ['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    
    const project = await prisma.project.findFirst({
      where: isAdminUser 
        ? { id: projectId }
        : { id: projectId, ownerId: session.user.id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Check if share link already exists for this project
    const existingShare = await prisma.shareToken.findFirst({
      where: { projectId },
      include: { project: true }
    })

    if (existingShare) {
      // Mark any related SHARE_REQUEST tasks as completed (link already exists)
      await prisma.adminTask.updateMany({
        where: {
          type: 'SHARE_REQUEST',
          status: 'PENDING',
          payload: {
            path: ['projectId'],
            equals: projectId
          }
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          result: {
            shareTokenId: existingShare.id,
            generatedBy: session.user.id,
            generatedAt: new Date().toISOString(),
            note: 'Share link already existed'
          }
        }
      })

      return NextResponse.json({ 
        share: {
          id: existingShare.id,
          token: existingShare.token,
          projectId: existingShare.projectId,
          projectName: existingShare.project?.name,
          expiresAt: existingShare.expiresAt?.toISOString(),
          maxAccesses: existingShare.maxAccesses,
          accessCount: existingShare.accessCount,
          createdAt: existingShare.createdAt.toISOString()
        },
        message: 'Share link already exists for this project'
      }, { status: 200 })
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

    // Mark any related SHARE_REQUEST tasks as completed
    await prisma.adminTask.updateMany({
      where: {
        type: 'SHARE_REQUEST',
        status: 'PENDING',
        payload: {
          path: ['projectId'],
          equals: projectId
        }
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        result: {
          shareTokenId: shareToken.id,
          generatedBy: session.user.id,
          generatedAt: new Date().toISOString()
        }
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

// PUT method for regenerating share link (ADMIN/SUPERADMIN only)
export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only ADMIN and SUPERADMIN can regenerate links
  if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden - Only ADMIN/SUPERADMIN can regenerate share links' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Delete existing share link if any
    await prisma.shareToken.deleteMany({
      where: { projectId }
    })

    // Create new share link
    const token = crypto.randomBytes(32).toString('hex')

    const shareToken = await prisma.shareToken.create({
      data: {
        token,
        projectId,
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
        createdAt: shareToken.createdAt.toISOString()
      },
      message: 'Share link regenerated successfully'
    }, { status: 200 })
  } catch (error) {
    console.error('Failed to regenerate share:', error)
    return NextResponse.json({ error: 'Failed to regenerate share' }, { status: 500 })
  }
}
