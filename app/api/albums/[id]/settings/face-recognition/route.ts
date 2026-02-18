import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

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

    const album = await prisma.album.findFirst({
      where: { 
        id,
        ownerId: session.user.id 
      }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const body = await request.json()
    const { enabled } = body

    const adminTask = await prisma.adminTask.create({
      data: {
        type: 'FACE_RECOGNITION',
        title: `Face Recognition for Album: ${album.name}`,
        description: enabled ? 'Process album for face detection and grouping' : 'Disable face recognition',
        payload: {
          albumId: id,
          albumName: album.name,
          enabled
        },
        status: 'PENDING',
        priority: 'MEDIUM',
        createdById: session.user.id
      }
    })

    await prisma.albumSettings.upsert({
      where: { albumId: id },
      update: {
        faceRecognitionEnabled: enabled,
        faceRecognitionStatus: 'PENDING'
      },
      create: {
        albumId: id,
        faceRecognitionEnabled: enabled,
        faceRecognitionStatus: 'PENDING'
      }
    })

    return NextResponse.json({ 
      success: true,
      task: {
        id: adminTask.id,
        status: adminTask.status
      }
    })
  } catch (error) {
    console.error('[FaceRecAPI] Failed to create task:', error)
    return NextResponse.json(
      { error: 'Failed to create face recognition task' },
      { status: 500 }
    )
  }
}
