import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logCritical } from '@/lib/error-handler'

export async function GET() {
  try {
    const tiles = await prisma.tile.findMany({
      orderBy: { position: 'asc' }
    })

    return NextResponse.json({ tiles })
  } catch (error) {
    logCritical('Failed to fetch tiles', 'TilesAPI', error as Error)
    return NextResponse.json({ error: 'Failed to fetch tiles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, position, size, config } = body

    const tile = await prisma.tile.create({
      data: {
        name,
        type: type || 'grid',
        position: position || 0,
        size: size || 'medium',
        config: config || {},
        isActive: true
      }
    })

    return NextResponse.json({ tile })
  } catch (error) {
    logCritical('Failed to create tile', 'TilesAPI', error as Error)
    return NextResponse.json({ error: 'Failed to create tile' }, { status: 500 })
  }
}
