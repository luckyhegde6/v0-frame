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
    const { name, category, description, color, icon, parentId, isActive } = body

    const classification = await prisma.classification.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
        ...(icon !== undefined && { icon }),
        ...(parentId !== undefined && { parentId }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json({ classification })
  } catch (error) {
    logCritical('Failed to update classification', 'ClassificationsAPI', error as Error)
    return NextResponse.json({ error: 'Failed to update classification' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.classification.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logCritical('Failed to delete classification', 'ClassificationsAPI', error as Error)
    return NextResponse.json({ error: 'Failed to delete classification' }, { status: 500 })
  }
}
