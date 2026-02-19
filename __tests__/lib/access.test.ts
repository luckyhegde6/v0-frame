import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    album: {
      findFirst: vi.fn(),
    },
    projectAccess: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    clientProjectAccess: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    clientAlbumAccess: {
      findFirst: vi.fn(),
    },
  },
}))

describe('Access Control Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isAdmin', () => {
    it('should return true for ADMIN role', async () => {
      const { isAdmin } = await import('@/lib/auth/access')
      
      expect(isAdmin('ADMIN')).toBe(true)
    })

    it('should return true for SUPERADMIN role', async () => {
      const { isAdmin } = await import('@/lib/auth/access')
      
      expect(isAdmin('SUPERADMIN')).toBe(true)
    })

    it('should return false for PRO role', async () => {
      const { isAdmin } = await import('@/lib/auth/access')
      
      expect(isAdmin('PRO')).toBe(false)
    })

    it('should return false for USER role', async () => {
      const { isAdmin } = await import('@/lib/auth/access')
      
      expect(isAdmin('USER')).toBe(false)
    })

    it('should return false for CLIENT role', async () => {
      const { isAdmin } = await import('@/lib/auth/access')
      
      expect(isAdmin('CLIENT')).toBe(false)
    })
  })

  describe('checkProjectAccess', () => {
    it('should grant full access for ADMIN user', async () => {
      const { checkProjectAccess } = await import('@/lib/auth/access')
      
      const result = await checkProjectAccess('project-123', 'user-123', 'ADMIN')
      
      expect(result.hasAccess).toBe(true)
      expect(result.accessLevel).toBe('FULL')
    })

    it('should grant full access for SUPERADMIN user', async () => {
      const { checkProjectAccess } = await import('@/lib/auth/access')
      
      const result = await checkProjectAccess('project-123', 'user-123', 'SUPERADMIN')
      
      expect(result.hasAccess).toBe(true)
      expect(result.accessLevel).toBe('FULL')
    })

    it('should grant access for project owner', async () => {
      const { checkProjectAccess } = await import('@/lib/auth/access')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.project.findFirst).mockResolvedValue({
        ownerId: 'user-123',
      } as any)
      
      const result = await checkProjectAccess('project-123', 'user-123', 'USER')
      
      expect(result.hasAccess).toBe(true)
      expect(result.accessLevel).toBe('FULL')
    })

    it('should deny access for non-owner USER', async () => {
      const { checkProjectAccess } = await import('@/lib/auth/access')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.project.findFirst).mockResolvedValue({
        ownerId: 'other-user',
      } as any)
      vi.mocked(prisma.default.projectAccess.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.default.clientProjectAccess.findFirst).mockResolvedValue(null)
      
      const result = await checkProjectAccess('project-123', 'user-123', 'USER')
      
      expect(result.hasAccess).toBe(false)
    })

    it('should grant access via projectAccess', async () => {
      const { checkProjectAccess } = await import('@/lib/auth/access')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.project.findFirst).mockResolvedValue({
        ownerId: 'other-user',
      } as any)
      vi.mocked(prisma.default.projectAccess.findFirst).mockResolvedValue({
        accessLevel: 'READ',
      } as any)
      
      const result = await checkProjectAccess('project-123', 'user-123', 'PRO')
      
      expect(result.hasAccess).toBe(true)
      expect(result.accessLevel).toBe('READ')
    })

    it('should grant access via clientProjectAccess', async () => {
      const { checkProjectAccess } = await import('@/lib/auth/access')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.project.findFirst).mockResolvedValue({
        ownerId: 'other-user',
      } as any)
      vi.mocked(prisma.default.projectAccess.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.default.clientProjectAccess.findFirst).mockResolvedValue({
        accessLevel: 'WRITE',
      } as any)
      
      const result = await checkProjectAccess('project-123', 'user-123', 'PRO')
      
      expect(result.hasAccess).toBe(true)
      expect(result.accessLevel).toBe('WRITE')
    })

    it('should return not found for non-existent project', async () => {
      const { checkProjectAccess } = await import('@/lib/auth/access')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.project.findFirst).mockResolvedValue(null)
      
      const result = await checkProjectAccess('nonexistent', 'user-123', 'USER')
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('Project not found')
    })
  })

  describe('checkAlbumAccess', () => {
    it('should grant full access for ADMIN user', async () => {
      const { checkAlbumAccess } = await import('@/lib/auth/access')
      
      const result = await checkAlbumAccess('album-123', 'user-123', 'ADMIN')
      
      expect(result.hasAccess).toBe(true)
      expect(result.accessLevel).toBe('FULL')
    })

    it('should grant access for album owner', async () => {
      const { checkAlbumAccess } = await import('@/lib/auth/access')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.album.findFirst).mockResolvedValue({
        ownerId: 'user-123',
        projectId: null,
      } as any)
      
      const result = await checkAlbumAccess('album-123', 'user-123', 'USER')
      
      expect(result.hasAccess).toBe(true)
      expect(result.accessLevel).toBe('FULL')
    })

    it('should grant access via project access', async () => {
      const { checkAlbumAccess } = await import('@/lib/auth/access')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.album.findFirst).mockResolvedValue({
        ownerId: 'other-user',
        projectId: 'project-123',
      } as any)
      vi.mocked(prisma.default.project.findFirst).mockResolvedValue({
        ownerId: 'user-123',
      } as any)
      
      const result = await checkAlbumAccess('album-123', 'user-123', 'USER')
      
      expect(result.hasAccess).toBe(true)
    })

    it('should return not found for non-existent album', async () => {
      const { checkAlbumAccess } = await import('@/lib/auth/access')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.album.findFirst).mockResolvedValue(null)
      
      const result = await checkAlbumAccess('nonexistent', 'user-123', 'USER')
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('Album not found')
    })
  })

  describe('getAccessibleProjectIds', () => {
    it('should return all project IDs for ADMIN', async () => {
      const { getAccessibleProjectIds } = await import('@/lib/auth/access')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.project.findMany).mockResolvedValue([
        { id: 'project-1' },
        { id: 'project-2' },
        { id: 'project-3' },
      ] as any)
      
      const result = await getAccessibleProjectIds('user-123', 'ADMIN')
      
      expect(result.length).toBe(3)
      expect(result).toContain('project-1')
      expect(result).toContain('project-2')
      expect(result).toContain('project-3')
    })

    it('should return owned and accessible projects for PRO user', async () => {
      const { getAccessibleProjectIds } = await import('@/lib/auth/access')
      const prisma = await import('@/lib/prisma')
      
      vi.mocked(prisma.default.project.findMany).mockResolvedValue([
        { id: 'project-1' },
        { id: 'project-2' },
      ] as any)
      
      vi.mocked(prisma.default.projectAccess.findMany).mockResolvedValue([
        { projectId: 'project-3' },
      ] as any)
      
      vi.mocked(prisma.default.clientProjectAccess.findMany).mockResolvedValue([
        { projectId: 'project-4' },
      ] as any)
      
      const result = await getAccessibleProjectIds('user-123', 'PRO')
      
      expect(result.length).toBe(4)
      expect(result).toContain('project-1')
      expect(result).toContain('project-2')
      expect(result).toContain('project-3')
      expect(result).toContain('project-4')
    })
  })
})
