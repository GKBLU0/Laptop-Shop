const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Reset users table to only the three demo accounts
  await prisma.user.deleteMany()

  const now = new Date()
  await prisma.user.createMany({
    data: [
      { username: 'admin', email: 'admin@zanzibar.shop', password_hash: 'admin123', role: 'admin', is_active: true, created_at: now, updated_at: now },
      { username: 'manager', email: 'manager@zanzibar.shop', password_hash: 'manager123', role: 'manager', is_active: true, created_at: now, updated_at: now },
      { username: 'worker', email: 'worker@zanzibar.shop', password_hash: 'worker123', role: 'worker', is_active: true, created_at: now, updated_at: now },
    ]
  })

  console.log('Seeded demo users.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })


