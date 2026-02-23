import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logCritical } from '@/lib/error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const faceGroup = await prisma.faceGroup.findUnique({
      where: { id },
      include: {
        album: {
          select: { id: true, name: true }
        },
        faces: {
          include: {
            image: {
              select: {
                id: true,
                title: true,
                thumbnailPath: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!faceGroup) {
      return NextResponse.json({ error: 'Face group not found' }, { status: 404 })
    }

    return NextResponse.json({ faceGroup })
  } catch (error) {
    logCritical('Failed to fetch face group', 'FaceGroupAPI', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch face group' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { label } = body

    const faceGroup = await prisma.faceGroup.update({
      where: { id },
      data: { label }
    })

    return NextResponse.json({ faceGroup })
  } catch (error) {
    logCritical('Failed to update face group', 'FaceGroupAPI', error as Error)
    return NextResponse.json(
      { error: 'Failed to update face group' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.detectedFace.updateMany({
      where: { faceGroupId: id },
      data: { faceGroupId: null }
    })

    await prisma.faceGroup.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logCritical('Failed to delete face group', 'FaceGroupAPI', error as Error)
    return NextResponse.json(
      { error: 'Failed to delete face group' },
      { status: 500 }
    )
  }
}
