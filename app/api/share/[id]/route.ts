import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    const shareToken = await prisma.shareToken.findFirst({
      where: {
        id,
        createdById: session.user.id
      }
    })

    if (!shareToken) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    await prisma.shareToken.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete share:', error)
    return NextResponse.json({ error: 'Failed to delete share' }, { status: 500 })
  }
}
