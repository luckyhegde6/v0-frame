import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { retrieveFile, USE_SUPABASE_STORAGE, BUCKETS, getFileUrl } from '@/lib/storage'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const image = await prisma.image.findUnique({
        where: { id },
        include: { album: true }
    })

    if (!image || !image.tempPath) {
        return new NextResponse('Not Found', { status: 404 })
    }

    try {
        let localPath: string | null = null

        if (USE_SUPABASE_STORAGE && image.tempPath.includes('/')) {
            const [bucket, ...pathParts] = image.tempPath.split('/')
            const storagePath = pathParts.join('/')
            
            const bucketName = bucket as keyof typeof BUCKETS
            if (Object.values(BUCKETS).includes(bucketName as any)) {
                localPath = await retrieveFile({
                    bucket: bucketName as any,
                    path: storagePath,
                })
            }
        }

        if (!localPath) {
            try {
                await fs.access(image.tempPath)
                localPath = image.tempPath
            } catch {
                const extension = image.tempPath.split('.').pop() || 'jpg'
                const possiblePaths = [
                    path.join(process.cwd(), 'storage', 'user', image.userId, 'Gallery', 'images', `${id}.${extension}`),
                    path.join(os.tmpdir(), 'v0-frame', 'storage', 'user-gallery', image.userId, 'Gallery', 'images', `${id}.${extension}`),
                    path.join(process.cwd(), 'user-gallery', image.userId, 'Gallery', 'images', `${id}.${extension}`),
                ]

                for (const tryPath of possiblePaths) {
                    try {
                        await fs.access(tryPath)
                        localPath = tryPath
                        break
                    } catch {
                        continue
                    }
                }
            }
        }

        if (!localPath) {
            console.error(`Image file not found for id ${id}, tempPath: ${image.tempPath}`)
            return new NextResponse('Image file not found', { status: 404 })
        }

        const fileBuffer = await fs.readFile(localPath)
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
