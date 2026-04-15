import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

import 'dotenv/config'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')
  const existingUser = await prisma.user.findUnique({
    where: {
      clerkUserId: 'seed_clerk_user',
    },
  })

  if (existingUser) {
    console.log('Seed user already exists')
    return
  }

  await prisma.user.create({
    data: {
      clerkUserId: 'seed_clerk_user',
      linkedAccounts: {
        create: {
          provider: 'GITHUB',
          providerUserId: 'seed-github-user',
          username: 'synchub-demo',
          metadata: {
            source: 'seed',
          },
        },
      },
    },
  })
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
