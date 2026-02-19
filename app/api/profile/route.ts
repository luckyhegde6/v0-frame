import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true
      }
    })

    const profile = await prisma.proProfile.findUnique({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ user, profile })
  } catch (error) {
    console.error('[ProfileAPI] Failed to fetch profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      businessName,
      location,
      phone,
      email,
      website,
      bio,
      facebook,
      instagram,
      twitter,
      linkedin,
      portfolioUrl
    } = body

    const profile = await prisma.proProfile.upsert({
      where: { userId: session.user.id },
      update: {
        businessName: businessName ?? undefined,
        location: location ?? undefined,
        phone: phone ?? undefined,
        email: email ?? undefined,
        website: website ?? undefined,
        bio: bio ?? undefined,
        facebook: facebook ?? undefined,
        instagram: instagram ?? undefined,
        twitter: twitter ?? undefined,
        linkedin: linkedin ?? undefined,
        portfolioUrl: portfolioUrl ?? undefined
      },
      create: {
        userId: session.user.id,
        businessName: businessName ?? null,
        location: location ?? null,
        phone: phone ?? null,
        email: email ?? null,
        website: website ?? null,
        bio: bio ?? null,
        facebook: facebook ?? null,
        instagram: instagram ?? null,
        twitter: twitter ?? null,
        linkedin: linkedin ?? null,
        portfolioUrl: portfolioUrl ?? null
      }
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('[ProfileAPI] Failed to update profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
