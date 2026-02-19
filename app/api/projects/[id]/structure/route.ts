import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { checkProjectAccess } from '@/lib/auth/access'
import path from 'path'

const STORAGE_DIR = process.env.STORAGE_DIR || '/tmp/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: projectId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role

    const access = await checkProjectAccess(projectId, session.user.id, userRole)
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId },
      include: {
        albums: {
          include: {
            images: {
              where: { storageType: 'ALBUM' }
            }
          }
        },
        images: {
          include: { image: true }
        },
        owner: {
          select: { name: true, email: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Build directory structure
    const structure = {
      project: {
        id: project.id,
        name: project.name,
        owner: project.owner,
        storageUsed: project.storageUsed.toString(),
        quotaBytes: project.quotaBytes.toString()
      },
      directories: [] as any[]
    }

    // Project root directory
    const projectDir = {
      name: `projects/${project.id}`,
      type: 'directory',
      path: path.join(STORAGE_DIR, 'projects', project.id),
      size: 0,
      children: [] as any[]
    }

    // Albums directory
    if (project.albums.length > 0) {
      const albumsDir = {
        name: 'albums',
        type: 'directory',
        path: path.join(STORAGE_DIR, 'projects', project.id, 'albums'),
        size: 0,
        children: project.albums.map(album => {
          const albumSize = album.images.reduce((acc, img) => acc + (img.sizeBytes || 0), 0)
          return {
            name: album.id,
            displayName: album.name,
            type: 'directory',
            path: path.join(STORAGE_DIR, 'projects', project.id, 'albums', album.id),
            size: albumSize,
            imageCount: album.images.length,
            category: album.category,
            children: album.images.map(img => ({
              name: `${img.id}.${img.mimeType?.split('/')[1] || 'jpg'}`,
              type: 'file',
              size: img.sizeBytes,
              dimensions: `${img.width}x${img.height}`,
              status: img.status,
              path: path.join(STORAGE_DIR, 'projects', project.id, 'albums', album.id, `${img.id}.${img.mimeType?.split('/')[1] || 'jpg'}`)
            }))
          }
        })
      }
      projectDir.children.push(albumsDir)
    }

    // Direct project images (via ProjectImage junction)
    if (project.images.length > 0) {
      const imagesDir = {
        name: 'images',
        type: 'directory',
        path: path.join(STORAGE_DIR, 'projects', project.id, 'images'),
        size: project.images.reduce((acc, pi) => acc + (pi.image.sizeBytes || 0), 0),
        children: project.images.map(pi => ({
          name: `${pi.image.id}.${pi.image.mimeType?.split('/')[1] || 'jpg'}`,
          type: 'file',
          size: pi.image.sizeBytes,
          dimensions: `${pi.image.width}x${pi.image.height}`,
          status: pi.image.status,
          path: path.join(STORAGE_DIR, 'projects', project.id, 'images', `${pi.image.id}.${pi.image.mimeType?.split('/')[1] || 'jpg'}`)
        }))
      }
      projectDir.children.push(imagesDir)
    }

    // Thumbnails
    const thumbnailIds = new Set<string>()
    project.albums.forEach(album => {
      album.images.forEach(img => thumbnailIds.add(img.id))
    })
    project.images.forEach(pi => thumbnailIds.add(pi.image.id))
    
    if (thumbnailIds.size > 0) {
      const thumbnailsDir = {
        name: 'thumbnails',
        type: 'directory-reference',
        path: path.join(STORAGE_DIR, 'thumbnails'),
        note: 'Thumbnails are stored in a shared location',
        count: thumbnailIds.size,
        preview: `Contains thumbnails for ${thumbnailIds.size} images`
      }
      projectDir.children.push(thumbnailsDir)
    }

    structure.directories.push(projectDir)

    return NextResponse.json(structure)
  } catch (error) {
    console.error('[ProjectStructureAPI] Failed to get structure:', error)
    return NextResponse.json(
      { error: 'Failed to get project structure' },
      { status: 500 }
    )
  }
}
