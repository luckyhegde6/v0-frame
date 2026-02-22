import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    proRequest: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
    },
    album: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/audit', () => ({
  logProRequestSubmitted: vi.fn(),
  logProjectExportRequested: vi.fn(),
}))

describe('/api/requests', () => {
  let mockAuth: ReturnType<typeof vi.fn>
  let mockPrisma: typeof import('@/lib/prisma').default

  beforeEach(async () => {
    vi.clearAllMocks()
    mockAuth = (await import('@/lib/auth/auth')).auth
    mockPrisma = (await import('@/lib/prisma')).default
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)
      
      const { GET } = await import('@/app/api/requests/route')
      const response = await GET()
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return user requests when authenticated', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
      
      const mockRequests = [
        {
          id: 'req-1',
          type: 'PROJECT_EXPORT_REQUEST',
          title: 'Export Project',
          status: 'PENDING',
          createdAt: new Date(),
          project: { id: 'proj-1', name: 'My Project' },
          album: null,
        },
        {
          id: 'req-2',
          type: 'THUMBNAIL_REGENERATION',
          title: 'Regenerate Thumbnails',
          status: 'COMPLETED',
          createdAt: new Date(),
          project: { id: 'proj-2', name: 'Another Project' },
          album: { id: 'album-1', name: 'Wedding' },
        },
      ]
      
      vi.mocked(mockPrisma.proRequest.findMany).mockResolvedValue(mockRequests as any)
      
      const { GET } = await import('@/app/api/requests/route')
      const response = await GET()
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.requests).toHaveLength(2)
      expect(mockPrisma.proRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
      vi.mocked(mockPrisma.proRequest.findMany).mockRejectedValue(new Error('DB Error'))
      
      const { GET } = await import('@/app/api/requests/route')
      const response = await GET()
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to fetch requests')
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)
      
      const { POST } = await import('@/app/api/requests/route')
      const request = new NextRequest('http://localhost/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'PROJECT_EXPORT_REQUEST', title: 'Test' }),
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(401)
    })

    it('should return 403 for non-PRO users', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({
        role: 'USER',
      } as any)
      
      const { POST } = await import('@/app/api/requests/route')
      const request = new NextRequest('http://localhost/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'PROJECT_EXPORT_REQUEST', title: 'Test' }),
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('PRO subscription required')
    })

    it('should allow PRO users to create requests', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({
        role: 'PRO',
      } as any)
      vi.mocked(mockPrisma.project.findFirst).mockResolvedValue({
        id: 'proj-123',
        name: 'My Project',
      } as any)
      vi.mocked(mockPrisma.proRequest.create).mockResolvedValue({
        id: 'req-123',
        type: 'PROJECT_EXPORT_REQUEST',
        title: 'Export My Project',
        status: 'PENDING',
      } as any)
      
      const { POST } = await import('@/app/api/requests/route')
      const request = new NextRequest('http://localhost/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PROJECT_EXPORT_REQUEST',
          title: 'Export My Project',
          payload: { projectId: 'proj-123' },
        }),
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.request).toBeDefined()
    })

    it('should allow ADMIN users to create requests', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'admin-123' } })
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({
        role: 'ADMIN',
      } as any)
      vi.mocked(mockPrisma.proRequest.create).mockResolvedValue({
        id: 'req-123',
        type: 'SHARE_REQUEST',
        title: 'Share Link',
        status: 'PENDING',
      } as any)
      
      const { POST } = await import('@/app/api/requests/route')
      const request = new NextRequest('http://localhost/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SHARE_REQUEST',
          title: 'Share Link',
        }),
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(201)
    })

    it('should return 400 for invalid request type', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({
        role: 'PRO',
      } as any)
      
      const { POST } = await import('@/app/api/requests/route')
      const request = new NextRequest('http://localhost/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'INVALID_TYPE',
          title: 'Test',
        }),
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request type')
    })

    it('should return 400 when type or title is missing', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({
        role: 'PRO',
      } as any)
      
      const { POST } = await import('@/app/api/requests/route')
      const request = new NextRequest('http://localhost/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'PROJECT_EXPORT_REQUEST' }),
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Type and title are required')
    })

    it('should return 404 when project not found', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({
        role: 'PRO',
      } as any)
      vi.mocked(mockPrisma.project.findFirst).mockResolvedValue(null)
      
      const { POST } = await import('@/app/api/requests/route')
      const request = new NextRequest('http://localhost/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PROJECT_EXPORT_REQUEST',
          title: 'Export',
          payload: { projectId: 'non-existent' },
        }),
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Project not found')
    })

    it('should return 404 when album not found', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({
        role: 'PRO',
      } as any)
      vi.mocked(mockPrisma.project.findFirst).mockResolvedValue({
        id: 'proj-123',
      } as any)
      vi.mocked(mockPrisma.album.findFirst).mockResolvedValue(null)
      
      const { POST } = await import('@/app/api/requests/route')
      const request = new NextRequest('http://localhost/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'THUMBNAIL_REGENERATION',
          title: 'Regenerate',
          payload: { projectId: 'proj-123', albumId: 'non-existent' },
        }),
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Album not found')
    })

    it('should create request with all valid types', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } })
      vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({
        role: 'PRO',
      } as any)
      vi.mocked(mockPrisma.proRequest.create).mockResolvedValue({
        id: 'req-123',
        type: 'FACE_RECOGNITION',
        title: 'Face Recognition',
        status: 'PENDING',
      } as any)
      
      const validTypes = [
        'PROJECT_EXPORT_REQUEST',
        'THUMBNAIL_REGENERATION',
        'FACE_RECOGNITION',
        'WATERMARK_ENABLE',
        'SHARE_REQUEST',
      ]
      
      const { POST } = await import('@/app/api/requests/route')
      
      for (const type of validTypes) {
        vi.mocked(mockPrisma.proRequest.create).mockClear()
        
        const request = new NextRequest('http://localhost/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            title: `Request for ${type}`,
          }),
        })
        
        const response = await POST(request)
        expect(response.status).toBe(201)
        expect(mockPrisma.proRequest.create).toHaveBeenCalled()
      }
    })
  })
})
