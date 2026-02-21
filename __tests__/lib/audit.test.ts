import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

describe('Audit Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Exported Functions', () => {
    it('should export all audit helper functions', async () => {
      const audit = await import('@/lib/audit')
      
      expect(typeof audit.logAuditEvent).toBe('function')
      expect(typeof audit.logUserCreated).toBe('function')
      expect(typeof audit.logUserUpdated).toBe('function')
      expect(typeof audit.logUserDeleted).toBe('function')
      expect(typeof audit.logUserLogin).toBe('function')
      expect(typeof audit.logUserLogout).toBe('function')
      expect(typeof audit.logProjectCreated).toBe('function')
      expect(typeof audit.logProjectUpdated).toBe('function')
      expect(typeof audit.logProjectDeleted).toBe('function')
      expect(typeof audit.logAlbumCreated).toBe('function')
      expect(typeof audit.logAlbumUpdated).toBe('function')
      expect(typeof audit.logAlbumDeleted).toBe('function')
      expect(typeof audit.logAlbumImageAdded).toBe('function')
      expect(typeof audit.logAlbumImageRemoved).toBe('function')
      expect(typeof audit.logImageUploaded).toBe('function')
      expect(typeof audit.logImageDeleted).toBe('function')
      expect(typeof audit.logJobCreated).toBe('function')
      expect(typeof audit.logJobStarted).toBe('function')
      expect(typeof audit.logJobCompleted).toBe('function')
      expect(typeof audit.logJobFailed).toBe('function')
      expect(typeof audit.logClientAccessGranted).toBe('function')
      expect(typeof audit.logClientAccessRevoked).toBe('function')
      expect(typeof audit.logShareLinkCreated).toBe('function')
      expect(typeof audit.logShareLinkAccessed).toBe('function')
      expect(typeof audit.logImageDownloaded).toBe('function')
      expect(typeof audit.logAlbumDownloaded).toBe('function')
      expect(typeof audit.logProRequestSubmitted).toBe('function')
      expect(typeof audit.logProjectExportRequested).toBe('function')
      expect(typeof audit.logFaceRecognitionRequested).toBe('function')
      expect(typeof audit.logWatermarkRequested).toBe('function')
    })
  })

  describe('logUserLogin', () => {
    it('should call logAuditEvent with correct parameters', async () => {
      const audit = await import('@/lib/audit')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue({
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      } as any)
      
      vi.mocked(prisma.default.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)
      
      await audit.logUserLogin('user-123', '127.0.0.1', 'Mozilla/5.0')
      
      expect(prisma.default.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('logProjectCreated', () => {
    it('should log project creation with metadata', async () => {
      const audit = await import('@/lib/audit')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue({
        email: 'admin@example.com',
        name: 'Admin',
        role: 'ADMIN',
      } as any)
      
      vi.mocked(prisma.default.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)
      
      await audit.logProjectCreated('project-123', 'user-123', {
        name: 'Test Project',
        eventName: 'Wedding',
      })
      
      expect(prisma.default.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('logAlbumImageAdded', () => {
    it('should log album image addition with image IDs', async () => {
      const audit = await import('@/lib/audit')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue({
        email: 'user@example.com',
        name: 'User',
        role: 'USER',
      } as any)
      
      vi.mocked(prisma.default.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)
      
      await audit.logAlbumImageAdded('album-123', ['img-1', 'img-2'], 'user-123', {
        albumName: 'My Album',
      })
      
      expect(prisma.default.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('logClientAccessGranted', () => {
    it('should log client access grant', async () => {
      const audit = await import('@/lib/audit')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue({
        email: 'admin@example.com',
        name: 'Admin',
        role: 'ADMIN',
      } as any)
      
      vi.mocked(prisma.default.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)
      
      await audit.logClientAccessGranted('project-123', 'client-123', 'READ', 'admin-123')
      
      expect(prisma.default.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle prisma errors gracefully', async () => {
      const audit = await import('@/lib/audit')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.user.findUnique).mockRejectedValue(new Error('DB Error'))
      
      // Should not throw
      await expect(audit.logUserLogin('user-123')).resolves.toBeUndefined()
    })
  })

  describe('logImageDownloaded', () => {
    it('should log image download', async () => {
      const audit = await import('@/lib/audit')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue({
        email: 'user@example.com',
        name: 'User',
        role: 'USER',
      } as any)
      
      vi.mocked(prisma.default.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)
      
      await audit.logImageDownloaded('img-123', 'user-123')
      
      expect(prisma.default.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'IMAGE_DOWNLOADED',
            entityType: 'Image',
            entityId: 'img-123',
          })
        })
      )
    })
  })

  describe('logAlbumDownloaded', () => {
    it('should log album download with image count', async () => {
      const audit = await import('@/lib/audit')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue({
        email: 'user@example.com',
        name: 'User',
        role: 'USER',
      } as any)
      
      vi.mocked(prisma.default.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)
      
      await audit.logAlbumDownloaded('album-123', 'user-123', 50)
      
      expect(prisma.default.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ALBUM_DOWNLOADED',
            entityType: 'Album',
            entityId: 'album-123',
            metadata: expect.objectContaining({
              imageCount: 50
            })
          })
        })
      )
    })
  })

  describe('logProRequestSubmitted', () => {
    it('should log PRO request submission', async () => {
      const audit = await import('@/lib/audit')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue({
        email: 'pro@example.com',
        name: 'PRO User',
        role: 'PRO',
      } as any)
      
      vi.mocked(prisma.default.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)
      
      await audit.logProRequestSubmitted('req-123', 'user-123', 'PROJECT_EXPORT_REQUEST', {
        projectId: 'proj-456',
        title: 'Export My Project'
      })
      
      expect(prisma.default.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PRO_REQUEST_SUBMITTED',
            entityType: 'ProRequest',
            entityId: 'req-123',
            metadata: expect.objectContaining({
              requestType: 'PROJECT_EXPORT_REQUEST',
              projectId: 'proj-456'
            })
          })
        })
      )
    })
  })

  describe('logProjectExportRequested', () => {
    it('should log project export request', async () => {
      const audit = await import('@/lib/audit')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue({
        email: 'pro@example.com',
        name: 'PRO User',
        role: 'PRO',
      } as any)
      
      vi.mocked(prisma.default.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)
      
      await audit.logProjectExportRequested('proj-123', 'user-123', {
        requestId: 'req-456'
      })
      
      expect(prisma.default.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PROJECT_EXPORT_REQUESTED',
            entityType: 'Project',
            entityId: 'proj-123'
          })
        })
      )
    })
  })

  describe('logFaceRecognitionRequested', () => {
    it('should log face recognition request', async () => {
      const audit = await import('@/lib/audit')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue({
        email: 'pro@example.com',
        name: 'PRO User',
        role: 'PRO',
      } as any)
      
      vi.mocked(prisma.default.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)
      
      await audit.logFaceRecognitionRequested('album-123', 'user-123')
      
      expect(prisma.default.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'FACE_RECOGNITION_REQUESTED',
            entityType: 'Album',
            entityId: 'album-123'
          })
        })
      )
    })
  })

  describe('logWatermarkRequested', () => {
    it('should log watermark request', async () => {
      const audit = await import('@/lib/audit')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue({
        email: 'pro@example.com',
        name: 'PRO User',
        role: 'PRO',
      } as any)
      
      vi.mocked(prisma.default.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)
      
      await audit.logWatermarkRequested('album-123', 'user-123', {
        watermarkText: 'My Brand'
      })
      
      expect(prisma.default.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'WATERMARK_REQUESTED',
            entityType: 'Album',
            entityId: 'album-123'
          })
        })
      )
    })
  })
})
