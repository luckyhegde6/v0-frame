import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'

async function main() {
  console.log('Seeding database for FRAME...')

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@frame.app'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  
  const demoUsers = [
    { email: adminEmail, name: 'Super Admin', password: adminPassword, role: 'SUPERADMIN' },
    { email: 'admin2@frame.app', name: 'Admin User', password: 'admin123', role: 'ADMIN' },
    { email: 'user@frame.app', name: 'Regular User', password: 'user123', role: 'USER' },
    { email: 'pro@frame.app', name: 'Pro User', password: 'pro123', role: 'PRO' },
    { email: 'client@frame.app', name: 'Client User', password: 'client123', role: 'CLIENT' },
  ]

  for (const userData of demoUsers) {
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
          role: userData.role as 'USER' | 'PRO' | 'CLIENT' | 'ADMIN' | 'SUPERADMIN',
        },
      })
      
      console.log(`Created user: ${userData.email} (${userData.role})`)
    } else {
      console.log(`User already exists: ${userData.email}`)
    }
  }

  console.log('\n=== Demo Credentials ===')
  console.log('SUPERADMIN: admin@frame.app / admin123')
  console.log('ADMIN: admin2@frame.app / admin123')
  console.log('USER: user@frame.app / user123')
  console.log('PRO: pro@frame.app / pro123')
  console.log('CLIENT: client@frame.app / client123')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
