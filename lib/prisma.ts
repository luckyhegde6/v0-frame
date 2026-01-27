import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Use POSTGRES_PRISMA_URL (Supabase) if available, fallback to DATABASE_URL (local)
let connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_PRISMA_URL environment variable is not set')
}

// Ensure explicit SSL mode to avoid pg-connection-string deprecation warning
// Use libpq compatibility mode which accepts self-signed certificates
if (!connectionString.includes('sslmode=')) {
  const separator = connectionString.includes('?') ? '&' : '?'
  connectionString += `${separator}sslmode=require`
}

// Configure pool with SSL options for self-signed certificates
const poolConfig: any = { connectionString }

// For development/self-signed certificates, disable certificate verification
// In production, this should be handled via proper certificate management
if (process.env.NODE_ENV !== 'production') {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  }
}

const pool = new Pool(poolConfig)
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
