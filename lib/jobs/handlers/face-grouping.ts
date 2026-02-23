import prisma from '@/lib/prisma'

export async function handleFaceGrouping(payload: any, jobId: string): Promise<void> {
  const { albumId, threshold = 0.8 } = payload

  console.log(`[Face Grouping] Processing album: ${albumId}, threshold: ${threshold}`)

  const faces = await prisma.detectedFace.findMany({
    where: albumId ? {
      image: { albumId }
    } : {},
    include: {
      image: {
        select: { albumId: true }
      },
      faceGroup: true
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`[Face Grouping] Found ${faces.length} faces to process`)

  const ungroupedFaces = faces.filter(f => !f.faceGroupId)

  console.log(`[Face Grouping] ${ungroupedFaces.length} ungrouped faces`)

  const groups: Map<string, string[]> = new Map()
  const faceToGroup: Map<string, string> = new Map()

  for (const face of ungroupedFaces) {
    if (faceToGroup.has(face.id)) continue

    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    groups.set(groupId, [face.id])
    faceToGroup.set(face.id, groupId)

    for (const otherFace of ungroupedFaces) {
      if (face.id === otherFace.id || faceToGroup.has(otherFace.id)) continue

      const embedding1 = face.embedding as number[] | null
      const embedding2 = otherFace.embedding as number[] | null

      if (!embedding1 || !embedding2) continue

      const similarity = cosineSimilarity(embedding1, embedding2)
      
      if (similarity >= threshold) {
        groups.get(groupId)?.push(otherFace.id)
        faceToGroup.set(otherFace.id, groupId)
      }
    }
  }

  for (const [groupId, faceIds] of groups) {
    if (faceIds.length < 1) continue

    const sampleFace = await prisma.detectedFace.findFirst({
      where: { id: faceIds[0] },
      include: { image: true }
    })

    const album = sampleFace?.image.albumId

    const group = await prisma.faceGroup.create({
      data: {
        albumId: album || null,
        faceCount: faceIds.length,
        suggestedName: album ? `Person in ${album}` : null
      }
    })

    await prisma.detectedFace.updateMany({
      where: { id: { in: faceIds } },
      data: { faceGroupId: group.id }
    })

    console.log(`[Face Grouping] Created group ${group.id} with ${faceIds.length} faces`)
  }

  console.log(`[Face Grouping] Complete: ${groups.size} groups created`)
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
