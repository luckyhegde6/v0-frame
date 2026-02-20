import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'

async function ensureSuperAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set')
    console.error('Set them in your .env file or pass them when running the script')
    process.exit(1)
  }

  console.log(`Checking for superadmin: ${adminEmail}`)

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  if (!existingUser) {
    const newUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Super Admin',
        password: hashedPassword,
        role: 'SUPERADMIN',
      },
    })
    console.log(`✅ Created SUPERADMIN: ${newUser.email}`)
    return { action: 'created', user: newUser }
  }

  if (existingUser.role !== 'SUPERADMIN') {
    const updatedUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'SUPERADMIN' },
    })
    console.log(`✅ Updated role to SUPERADMIN: ${updatedUser.email}`)
  }

  const passwordMatches = existingUser.password 
    ? await bcrypt.compare(adminPassword, existingUser.password)
    : false

  if (!passwordMatches) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { password: hashedPassword },
    })
    console.log(`✅ Updated password for: ${adminEmail}`)
  }

  console.log(`✅ SUPERADMIN ready: ${adminEmail}`)
  return { action: 'updated', user: existingUser }
}

async function main() {
  console.log('=== Ensuring SUPERADMIN exists ===')
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log('')

  try {
    await ensureSuperAdmin()
    console.log('\n✅ Done!')
  } catch (error) {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
