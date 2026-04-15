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
  const counter = await prisma.count.findUnique({
    where: {
      key: 'global_counter',
    },
  })

  if (counter) {
    console.log('Counter already exists')
    return
  }

  await prisma.count.create({
    data: {
      key: 'global_counter',
      value: 0,
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
