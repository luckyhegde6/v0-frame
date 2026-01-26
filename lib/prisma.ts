import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Use POSTGRES_PRISMA_URL (Supabase) if available, fallback to DATABASE_URL (local)
const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_PRISMA_URL environment variable is not set')
}
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        errorFormat: 'pretty',
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
