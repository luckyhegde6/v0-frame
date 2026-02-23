import { Pool } from 'pg'

const PROD_URL = 'postgres://postgres.viuvufbhcscavvdfoqqn:L9UuoUJdBiNmhUhl@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require'

const pool = new Pool({ 
  connectionString: PROD_URL,
  ssl: {
    rejectUnauthorized: process.env.SKIP_SSL_VERIFICATION !== 'true'
  }
})

const enumAdditions = [
  { type: 'JobStatus', values: ['CANCELLED'] },
  { type: 'AuditAction', values: ['JOB_RETRY', 'JOB_CANCELLED', 'JOB_FORCE_RUN', 'IMAGE_DOWNLOADED', 'ALBUM_DOWNLOADED', 'PRO_REQUEST_SUBMITTED', 'PROJECT_EXPORT_REQUESTED', 'FACE_RECOGNITION_REQUESTED', 'WATERMARK_REQUESTED'] }
]

const tables = [
  {
    name: 'ProRequest',
    sql: `CREATE TABLE IF NOT EXISTS "ProRequest" (
      "id" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "title" TEXT NOT NULL,
      "description" TEXT,
      "payload" JSONB,
      "userId" TEXT NOT NULL,
      "projectId" TEXT,
      "albumId" TEXT,
      "adminNotes" TEXT,
      "completedAt" TIMESTAMP(3),
      "completedBy" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "ProRequest_pkey" PRIMARY KEY ("id")
    )`
  },
  {
    name: 'UserFavorite',
    sql: `CREATE TABLE IF NOT EXISTS "UserFavorite" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "imageId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
      CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "UserFavorite_userId_imageId_key" UNIQUE ("userId", "imageId")
    )`
  }
]

async function main() {
  console.log('🔄 Syncing production database...\n')

  // Add enum values
  for (const { type, values } of enumAdditions) {
    console.log(`📦 Adding values to ${type} enum...`)
    for (const value of values) {
      try {
        await pool.query(`ALTER TYPE "${type}" ADD VALUE IF NOT EXISTS '${value}'`)
        console.log(`  ✅ Added ${value}`)
      } catch (e: any) {
        if (e.code === '42710') {
          console.log(`  ⏭️  Already exists: ${value}`)
        } else {
          console.log(`  ❌ Error adding ${value}: ${e.message}`)
        }
      }
    }
  }

  // Create tables
  for (const { name, sql } of tables) {
    console.log(`\n📦 Creating ${name} table...`)
    try {
      await pool.query(sql)
      console.log(`  ✅ Created ${name}`)
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        console.log(`  ⏭️  Already exists: ${name}`)
      } else {
        console.log(`  ❌ Error: ${e.message}`)
      }
    }
  }

  // Add indexes
  console.log('\n📦 Creating indexes...')
  const indexes = [
    'CREATE INDEX IF NOT EXISTS "ProRequest_userId_idx" ON "ProRequest" ("userId")',
    'CREATE INDEX IF NOT EXISTS "ProRequest_type_idx" ON "ProRequest" ("type")',
    'CREATE INDEX IF NOT EXISTS "ProRequest_status_idx" ON "ProRequest" ("status")',
    'CREATE INDEX IF NOT EXISTS "ProRequest_createdAt_idx" ON "ProRequest" ("createdAt")',
    'CREATE INDEX IF NOT EXISTS "UserFavorite_userId_idx" ON "UserFavorite" ("userId")',
    'CREATE INDEX IF NOT EXISTS "UserFavorite_imageId_idx" ON "UserFavorite" ("imageId")'
  ]
  
  for (const idx of indexes) {
    const name = idx.match(/CREATE INDEX IF NOT EXISTS "(\w+)"/)?.[1] || ''
    try {
      await pool.query(idx)
      console.log(`  ✅ Created index: ${name}`)
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        console.log(`  ⏭️  Already exists: ${name}`)
      } else {
        console.log(`  ❌ Error: ${e.message}`)
      }
    }
  }

  // Add foreign keys
  console.log('\n📦 Adding foreign keys...')
  const fks = [
    { name: 'ProRequest_userId_fkey', sql: `ALTER TABLE "ProRequest" ADD CONSTRAINT "ProRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE` },
    { name: 'UserFavorite_userId_fkey', sql: `ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE` },
    { name: 'UserFavorite_imageId_fkey', sql: `ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE` }
  ]

  for (const { name, sql } of fks) {
    try {
      await pool.query(sql)
      console.log(`  ✅ Added foreign key: ${name}`)
    } catch (e: any) {
      if (e.message.includes('already exists') || e.code === '0P000') {
        console.log(`  ⏭️  Already exists: ${name}`)
      } else {
        console.log(`  ❌ Error: ${e.message}`)
      }
    }
  }

  console.log('\n✅ Production database sync complete!')
  await pool.end()
}

main().catch(console.error)
