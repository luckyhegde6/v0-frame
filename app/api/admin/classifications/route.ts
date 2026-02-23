import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logCritical } from '@/lib/error-handler'

export async function GET() {
  try {
    const classifications = await prisma.classification?.findMany({
      orderBy: { name: 'asc' }
    }) || []

    return NextResponse.json({ classifications })
  } catch (error) {
    logCritical('Failed to fetch classifications', 'ClassificationsAPI', error as Error)
    return NextResponse.json({ error: 'Failed to fetch classifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, description, color, icon, parentId } = body

    const classification = await prisma.classification?.create({
      data: {
        name,
        category: category || 'general',
        description,
        color: color || '#00D9FF',
        icon,
        parentId,
        isActive: true
      }
    })

    return NextResponse.json({ classification })
  } catch (error) {
    logCritical('Failed to create classification', 'ClassificationsAPI', error as Error)
    return NextResponse.json({ error: 'Failed to create classification' }, { status: 500 })
  }
}
