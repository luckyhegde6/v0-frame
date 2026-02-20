import prisma from '@/lib/prisma'

export type Role = 'USER' | 'PRO' | 'CLIENT' | 'ADMIN' | 'SUPERADMIN'

export interface AccessResult {
  hasAccess: boolean
  accessLevel?: 'READ' | 'WRITE' | 'FULL' | null
  reason?: string
}

export function isAdmin(role: Role | undefined): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN'
}

export async function checkProjectAccess(
  projectId: string,
  userId: string,
  userRole: Role
): Promise<AccessResult> {
  if (isAdmin(userRole)) {
    return { hasAccess: true, accessLevel: 'FULL' }
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId },
    select: { ownerId: true }
  })

  if (!project) {
    return { hasAccess: false, reason: 'Project not found' }
  }

  if (project.ownerId === userId) {
    return { hasAccess: true, accessLevel: 'FULL' }
  }

  const projectAccess = await prisma.projectAccess.findFirst({
    where: { projectId, userId }
  })

  if (projectAccess) {
    return { hasAccess: true, accessLevel: projectAccess.accessLevel }
  }

  const clientAccess = await prisma.clientProjectAccess.findFirst({
    where: { projectId, userId }
  })

  if (clientAccess) {
    return { hasAccess: true, accessLevel: clientAccess.accessLevel }
  }

  return { hasAccess: false, reason: 'No access to this project' }
}

export async function checkAlbumAccess(
  albumId: string,
  userId: string,
  userRole: Role
): Promise<AccessResult> {
  if (isAdmin(userRole)) {
    return { hasAccess: true, accessLevel: 'FULL' }
  }

  const album = await prisma.album.findFirst({
    where: { id: albumId },
    select: { ownerId: true, projectId: true }
  })

  if (!album) {
    return { hasAccess: false, reason: 'Album not found' }
  }

  if (album.ownerId === userId) {
    return { hasAccess: true, accessLevel: 'FULL' }
  }

  if (album.projectId) {
    const projectAccess = await checkProjectAccess(album.projectId, userId, userRole)
    if (projectAccess.hasAccess) {
      return projectAccess
    }
  }

  const albumAccess = await prisma.clientAlbumAccess.findFirst({
    where: { albumId, userId }
  })

  if (albumAccess) {
    return { hasAccess: true, accessLevel: albumAccess.accessLevel }
  }

  return { hasAccess: false, reason: 'No access to this album' }
}

export async function getAccessibleProjectIds(
  userId: string,
  userRole: Role
): Promise<string[]> {
  if (isAdmin(userRole)) {
    const projects = await prisma.project.findMany({
      select: { id: true }
    })
    return projects.map(p => p.id)
  }

  const ownedProjects = await prisma.project.findMany({
    where: { ownerId: userId },
    select: { id: true }
  })

  const projectAccess = await prisma.projectAccess.findMany({
    where: { userId },
    select: { projectId: true }
  })

  const clientProjectAccess = await prisma.clientProjectAccess.findMany({
    where: { userId },
    select: { projectId: true }
  })

  const projectIds = new Set<string>()
  ownedProjects.forEach(p => projectIds.add(p.id))
  projectAccess.forEach(p => projectIds.add(p.projectId))
  clientProjectAccess.forEach(p => projectIds.add(p.projectId))

  return Array.from(projectIds)
}
