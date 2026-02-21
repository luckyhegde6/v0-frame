import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const favorites = searchParams.get('favorites')
    const collectionId = searchParams.get('collection')
    
    // Gallery is private - users can only see their own images unless ADMIN/SUPERADMIN
    const userRole = session.user.role
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'
    
    // Handle favorites filter
    if (favorites === 'true') {
      const favoriteImages = await prisma.userFavorite.findMany({
        where: { userId: session.user.id },
        include: {
          image: {
            include: {
              collections: true,
              jobs: {
                where: { status: { in: ['PENDING', 'RUNNING'] } },
                select: { id: true, type: true, status: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      
      return NextResponse.json({
        data: favoriteImages.map(fav => ({
          ...fav.image,
          isFavorite: true,
          processingJobs: fav.image.jobs || [],
          isProcessing: fav.image.status === 'PROCESSING',
          isStored: fav.image.status === 'STORED'
        })),
        count: favoriteImages.length
      })
    }
    
    // Build where clause for normal queries
    const where: any = isAdmin 
      ? { storageType: 'GALLERY' } 
      : { userId: session.user.id, storageType: 'GALLERY' }
    
    if (collectionId) {
      where.collections = { some: { id: collectionId } }
    }
    
    const [images, collections, jobsByImageId] = await Promise.all([
      prisma.image.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          collections: true,
          jobs: {
            where: { status: { in: ['PENDING', 'RUNNING'] } },
            select: { id: true, type: true, status: true }
          }
        }
      }),
      prisma.collection.findMany({
        where: isAdmin ? {} : { userId: session.user.id },
        include: {
          _count: { select: { images: true } }
        }
      }),
      prisma.job.findMany({
        where: { status: { in: ['PENDING', 'RUNNING'] } },
        select: { id: true, imageId: true, type: true, status: true }
      })
    ])
    
    // Get user's favorites for these images
    const imageIds = images.map(img => img.id)
    const userFavorites = await prisma.userFavorite.findMany({
      where: { 
        userId: session.user.id,
        imageId: { in: imageIds }
      },
      select: { imageId: true }
    })
    const favoriteImageIds = new Set(userFavorites.map(f => f.imageId))

    // Create lookup map for jobs by imageId
    const jobsByImageMap = new Map<string, typeof jobsByImageId>();
    jobsByImageId.forEach(job => {
      if (!job.imageId) return;
      if (!jobsByImageMap.has(job.imageId)) {
        jobsByImageMap.set(job.imageId, []);
      }
      jobsByImageMap.get(job.imageId)?.push(job);
    });

    return NextResponse.json({
      data: images.map((img: any) => ({
        ...img,
        isFavorite: favoriteImageIds.has(img.id),
        processingJobs: jobsByImageMap.get(img.id) || [],
        isProcessing: img.status === 'PROCESSING',
        isStored: img.status === 'STORED',
        isSyncing: img.status === 'PROCESSING' || img.jobs.length > 0
      })),
      collections: collections.map((c: any) => ({
        id: c.id,
        name: c.name,
        count: c._count.images
      })),
      count: images.length,
    })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch images' },
      { status: 500 }
    )
  }
}
