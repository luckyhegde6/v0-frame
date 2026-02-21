import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: imageId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.userFavorite.findUnique({
      where: {
        userId_imageId: {
          userId: session.user.id,
          imageId
        }
      }
    })

    if (existing) {
      await prisma.userFavorite.delete({
        where: { id: existing.id }
      })
      return NextResponse.json({ favorite: false })
    } else {
      await prisma.userFavorite.create({
        data: {
          userId: session.user.id,
          imageId
        }
      })
      return NextResponse.json({ favorite: true })
    }
  } catch (error) {
    console.error('[FavoriteAPI] Error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: imageId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ isFavorite: false })
    }

    const favorite = await prisma.userFavorite.findUnique({
      where: {
        userId_imageId: {
          userId: session.user.id,
          imageId
        }
      }
    })

    return NextResponse.json({ isFavorite: !!favorite })
  } catch (error) {
    console.error('[FavoriteAPI] Error:', error)
    return NextResponse.json({ isFavorite: false })
  }
}
