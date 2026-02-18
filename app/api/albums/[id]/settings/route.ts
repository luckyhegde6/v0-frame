import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const album = await prisma.album.findFirst({
      where: { 
        id,
        ownerId: session.user.id 
      }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    let settings = await prisma.albumSettings.findUnique({
      where: { albumId: id }
    })

    if (!settings) {
      settings = await prisma.albumSettings.create({
        data: { albumId: id }
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('[AlbumSettingsAPI] Failed to fetch settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const album = await prisma.album.findFirst({
      where: { 
        id,
        ownerId: session.user.id 
      }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      imageQuality,
      videoQuality,
      shortQuality,
      maxImageWidth,
      maxImageHeight,
      watermarkEnabled,
      watermarkImage,
      watermarkOpacity,
      watermarkPosition,
      downloadEnabled,
      bulkDownloadEnabled
    } = body

    const settings = await prisma.albumSettings.upsert({
      where: { albumId: id },
      update: {
        imageQuality: imageQuality ?? undefined,
        videoQuality: videoQuality ?? undefined,
        shortQuality: shortQuality ?? undefined,
        maxImageWidth: maxImageWidth ?? undefined,
        maxImageHeight: maxImageHeight ?? undefined,
        watermarkEnabled: watermarkEnabled ?? undefined,
        watermarkImage: watermarkImage ?? undefined,
        watermarkOpacity: watermarkOpacity ?? undefined,
        watermarkPosition: watermarkPosition ?? undefined,
        downloadEnabled: downloadEnabled ?? undefined,
        bulkDownloadEnabled: bulkDownloadEnabled ?? undefined
      },
      create: {
        albumId: id,
        imageQuality: imageQuality || 'HIGH',
        videoQuality: videoQuality || 'HIGH',
        shortQuality: shortQuality || 'HIGH',
        maxImageWidth: maxImageWidth || 4000,
        maxImageHeight: maxImageHeight || 4000,
        watermarkEnabled: watermarkEnabled || false,
        watermarkImage: watermarkImage || null,
        watermarkOpacity: watermarkOpacity || 0.5,
        watermarkPosition: watermarkPosition || 'BOTTOM_RIGHT',
        downloadEnabled: downloadEnabled !== false,
        bulkDownloadEnabled: bulkDownloadEnabled !== false
      }
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('[AlbumSettingsAPI] Failed to update settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
