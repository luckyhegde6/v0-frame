import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'

const Role = {
  USER: 'USER',
  PRO: 'PRO',
  CLIENT: 'CLIENT',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
} as const

async function main() {
  console.log('Seeding database for Phase 4 Professional Projects...')

  // Create demo users for Phase 4 testing
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@frame.app'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  
  const users = [
    {
      email: adminEmail,
      name: 'Super Admin',
      password: adminPassword,
      role: Role.SUPERADMIN,
    },
    {
      email: 'admin@frame.app',
      name: 'Admin User',
      password: 'admin123',
      role: Role.ADMIN,
    },
    {
      email: 'user@frame.app',
      name: 'Regular User',
      password: 'user123',
      role: Role.USER,
    },
    {
      email: 'pro@frame.app',
      name: 'Pro User',
      password: 'pro123',
      role: Role.PRO,
    },
    {
      email: 'client@frame.app',
      name: 'Client User',
      password: 'client123',
      role: Role.CLIENT,
    },
  ]

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role as any,
        },
      })
      
      console.log(`Created user: ${userData.email} (${userData.role})`)
    } else {
      console.log(`User already exists: ${userData.email}`)
    }
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
