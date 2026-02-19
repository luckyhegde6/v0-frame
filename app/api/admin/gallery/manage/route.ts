import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { logImageDeleted } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, imageIds, sourceUserId, targetUserId, targetCollectionId, targetProjectId } = body

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: 'Image IDs are required' }, { status: 400 })
    }

    if (action === 'move' || action === 'copy') {
      if (!targetUserId && !targetCollectionId && !targetProjectId) {
        return NextResponse.json({ 
          error: 'Target user ID, collection ID, or project ID is required' 
        }, { status: 400 })
      }
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const imageId of imageIds) {
      try {
        const image = await prisma.image.findUnique({
          where: { id: imageId }
        })

        if (!image) {
          results.failed = results.failed + 1
          results.errors.push(`Image ${imageId} not found`)
          continue
        }

        // Gallery management only works with GALLERY type images
        // ALBUM type images are managed via /api/albums/{id}/images
        if (image.storageType !== 'GALLERY') {
          results.failed = results.failed + 1
          results.errors.push(`Image ${imageId} is not a gallery image (storageType: ${image.storageType})`)
          continue
        }

        if (action === 'delete') {
          await prisma.image.delete({
            where: { id: imageId }
          })
          await logImageDeleted(imageId, session.user.id, { title: image.title || 'Unknown' })
        } else if (action === 'move') {
          if (targetUserId && targetUserId !== image.userId) {
            await prisma.image.update({
              where: { id: imageId },
              data: { userId: targetUserId }
            })
          }
          if (targetProjectId) {
            const existingLink = await prisma.projectImage.findFirst({
              where: { imageId }
            })
            if (existingLink) {
              await prisma.projectImage.update({
                where: { id: existingLink.id },
                data: { projectId: targetProjectId }
              })
            } else {
              await prisma.projectImage.create({
                data: { imageId, projectId: targetProjectId }
              })
            }
          }
        } else if (action === 'copy') {
          await prisma.image.create({
            data: {
              title: `${image.title} (Copy)`,
              tempPath: image.tempPath,
              checksum: `${image.checksum}_copy_${Date.now()}`,
              mimeType: image.mimeType,
              width: image.width,
              height: image.height,
              sizeBytes: image.sizeBytes,
              userId: targetUserId || image.userId,
              status: image.status,
              storageType: 'GALLERY'
            }
          })
        } else if (action === 'clone') {
          await prisma.image.create({
            data: {
              title: `${image.title} (Clone)`,
              tempPath: image.tempPath,
              checksum: `${image.checksum}_clone_${Date.now()}`,
              mimeType: image.mimeType,
              width: image.width,
              height: image.height,
              sizeBytes: image.sizeBytes,
              userId: image.userId,
              status: image.status,
              storageType: 'GALLERY'
            }
          })
        }

        results.success = results.success + 1
      } catch (err) {
        results.failed = results.failed + 1
        results.errors.push(`Failed to process ${imageId}: ${err}`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('[GalleryAdminAPI] Gallery operation failed:', error)
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    )
  }
}
