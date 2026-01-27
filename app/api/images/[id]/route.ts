import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const image = await prisma.image.findUnique({
        where: { id },
    })

    if (!image || !image.tempPath) {
        return new NextResponse('Not Found', { status: 404 })
    }

    try {
        const fileBuffer = fs.readFileSync(image.tempPath)
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': image.mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch (error) {
        console.error('Error serving image:', error)
        return new NextResponse('Error serving image', { status: 500 })
    }
}
