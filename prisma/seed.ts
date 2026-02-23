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
    { email: 'user2@frame.app', name: 'User Two', password: 'user123', role: 'USER' },
    { email: 'user3@frame.app', name: 'User Three', password: 'user123', role: 'USER' },
    { email: 'pro@frame.app', name: 'Pro User', password: 'pro123', role: 'PRO' },
    { email: 'pro2@frame.app', name: 'Pro User Two', password: 'pro123', role: 'PRO' },
    { email: 'pro3@frame.app', name: 'Pro User Three', password: 'pro123', role: 'PRO' },
    { email: 'client@frame.app', name: 'Client User', password: 'client123', role: 'CLIENT' },
    { email: 'client2@frame.app', name: 'Client Two', password: 'client123', role: 'CLIENT' },
    { email: 'client3@frame.app', name: 'Client Three', password: 'client123', role: 'CLIENT' },
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

  // Seed default tiles
  const defaultTiles = [
    { name: 'Stats Overview', type: 'stats', position: 0, size: 'full', isActive: true },
    { name: 'Recent Activity', type: 'list', position: 1, size: 'medium', isActive: true },
    { name: 'Storage Chart', type: 'chart', position: 2, size: 'medium', isActive: true },
    { name: 'Quick Actions', type: 'grid', position: 3, size: 'medium', isActive: true },
  ]

  for (const tileData of defaultTiles) {
    const existingTile = await prisma.tile.findFirst({
      where: { name: tileData.name },
    })

    if (!existingTile) {
      await prisma.tile.create({
        data: tileData,
      })
      console.log(`Created tile: ${tileData.name}`)
    }
  }

  // Seed default classifications
  const defaultClassifications = [
    { name: 'Portrait', category: 'people', description: 'Portraits and selfies', color: '#FF6B6B' },
    { name: 'Landscape', category: 'scene', description: 'Nature and landscapes', color: '#4ECDC4' },
    { name: 'Event', category: 'event', description: 'Event photography', color: '#FFE66D' },
    { name: 'Product', category: 'object', description: 'Product shots', color: '#95E1D3' },
    { name: 'Family', category: 'people', description: 'Family photos', color: '#F38181' },
    { name: 'Travel', category: 'location', description: 'Travel photography', color: '#AA96DA' },
    { name: 'Food', category: 'object', description: 'Food photography', color: '#FCBAD3' },
    { name: 'Architecture', category: 'scene', description: 'Buildings and structures', color: '#A8D8EA' },
  ]

  for (const classData of defaultClassifications) {
    const existingClass = await prisma.classification.findFirst({
      where: { name: classData.name },
    })

    if (!existingClass) {
      await prisma.classification.create({
        data: classData,
      })
      console.log(`Created classification: ${classData.name}`)
    }
  }

  console.log('\n=== Demo Credentials ===')
  console.log('SUPERADMIN: admin@frame.app / admin123')
  console.log('ADMIN: admin2@frame.app / admin123')
  console.log('USER: user@frame.app / user123, user2@frame.app / user123, user3@frame.app / user123')
  console.log('PRO: pro@frame.app / pro123, pro2@frame.app / pro123, pro3@frame.app / pro123')
  console.log('CLIENT: client@frame.app / client123, client2@frame.app / client123, client3@frame.app / client123')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
