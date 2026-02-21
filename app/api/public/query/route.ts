import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const query = await prisma.publicQuery.create({
      data: {
        name,
        email,
        subject,
        message,
        status: 'PENDING'
      }
    })

    return NextResponse.json({ query }, { status: 201 })
  } catch (error) {
    console.error('[PublicQueryAPI] Failed to create query:', error)
    return NextResponse.json(
      { error: 'Failed to submit query' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const queries = await prisma.publicQuery.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    return NextResponse.json({ queries })
  } catch (error) {
    console.error('[PublicQueryAPI] Failed to fetch queries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queries' },
      { status: 500 }
    )
  }
}
