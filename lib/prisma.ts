import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Use POSTGRES_PRISMA_URL (Supabase) if available, fallback to DATABASE_URL (local)
let connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_PRISMA_URL environment variable is not set')
}

// Add SSL parameters to connection string if not already present
// Use libpq compatibility mode with explicit sslmode=require for proper self-signed certificate handling
// This prevents deprecation warnings and follows PostgreSQL standard libpq semantics
if (!connectionString.includes('sslmode=') && !connectionString.includes('uselibpqcompat=')) {
  const separator = connectionString.includes('?') ? '&' : '?'
  connectionString += `${separator}uselibpqcompat=true&sslmode=require`
}

// Configure pool with SSL options for self-signed certificates
// rejectUnauthorized=false allows connections to self-signed certificates
const poolConfig: any = {
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
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
