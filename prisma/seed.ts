import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { Role } from '@prisma/client'

async function main() {
  console.log('Seeding database for Phase 3 Authentication...')

  // Create demo users for Phase 3 testing
  const users = [
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
      
      await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
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
