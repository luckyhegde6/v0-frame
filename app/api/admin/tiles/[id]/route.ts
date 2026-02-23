import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logCritical } from '@/lib/error-handler'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type, position, size, config, isActive } = body

    const tile = await prisma.tile?.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(position !== undefined && { position }),
        ...(size && { size }),
        ...(config && { config }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json({ tile })
  } catch (error) {
    logCritical('Failed to update tile', 'TilesAPI', error as Error)
    return NextResponse.json({ error: 'Failed to update tile' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.tile?.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logCritical('Failed to delete tile', 'TilesAPI', error as Error)
    return NextResponse.json({ error: 'Failed to delete tile' }, { status: 500 })
  }
}
