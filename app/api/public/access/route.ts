import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, company, accessType, message } = body

    if (!name || !email || !accessType) {
      return NextResponse.json(
        { error: 'Name, email, and access type are required' },
        { status: 400 }
      )
    }

    const validTypes = ['USER', 'CLIENT', 'PRO']
    if (!validTypes.includes(accessType)) {
      return NextResponse.json(
        { error: 'Invalid access type' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 400 }
      )
    }

    const accessRequest = await prisma.publicAccessRequest.create({
      data: {
        name,
        email,
        company: company || null,
        accessType,
        message: message || null,
        status: 'PENDING'
      }
    })

    return NextResponse.json({ accessRequest }, { status: 201 })
  } catch (error) {
    console.error('[PublicAccessAPI] Failed to create access request:', error)
    return NextResponse.json(
      { error: 'Failed to submit access request' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const requests = await prisma.publicAccessRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    return NextResponse.json({ requests })
  } catch (error) {
    console.error('[PublicAccessAPI] Failed to fetch access requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch access requests' },
      { status: 500 }
    )
  }
}
