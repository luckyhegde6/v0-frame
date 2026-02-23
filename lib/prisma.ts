import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Use POSTGRES_PRISMA_URL (Supabase) if available, fallback to DATABASE_URL (local)
let connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_PRISMA_URL environment variable is not set')
}

// Detect if connecting to a local database
const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1') || process.env.ENVIRONMENT === 'local'

// Ensure explicit SSL mode to avoid pg-connection-string deprecation warning
// Only force SSL for remote connections
if (!isLocal && !connectionString.includes('sslmode=')) {
  const separator = connectionString.includes('?') ? '&' : '?'
  // uselibpqcompat=true ensures compatibility with future pg versions and suppresses warnings
  connectionString += `${separator}sslmode=require&uselibpqcompat=true`
}

// Configure pool with SSL options for self-signed certificates
const poolConfig: any = { connectionString }

// For remote connections, configure SSL to handle self-signed certificates
// Use proper SSL configuration instead of disabling global certificate validation
if (!isLocal) {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.SKIP_SSL_VERIFICATION !== 'true'
  }
}

const pool = new Pool(poolConfig)
const adapter = new PrismaPg(pool)

console.log('[Prisma] Initializing with:', {
  isLocal,
  hasPrismaPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  connectionStringTail: connectionString.split('@')[1] || connectionString.slice(-20)
})

const globalForPrisma = global as unknown as { prisma: PrismaClient & { _adapter?: any } }

export const prisma =
  (globalForPrisma.prisma && globalForPrisma.prisma._adapter) ?
    globalForPrisma.prisma :
    new PrismaClient({
      adapter,
      errorFormat: 'pretty',
    })

// Store adapter reference for cache validation
if (!(prisma as any)._adapter) {
  ; (prisma as any)._adapter = adapter
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
