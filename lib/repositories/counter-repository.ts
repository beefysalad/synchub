import prisma from '@/lib/prisma'

export const counterRepository = {
  findGlobal() {
    return prisma.count.findUnique({
      where: { key: 'global_counter' },
    })
  },

  createGlobal(value = 0) {
    return prisma.count.create({
      data: {
        key: 'global_counter',
        value,
      },
    })
  },

  incrementGlobal() {
    return prisma.count.upsert({
      where: { key: 'global_counter' },
      update: {
        value: { increment: 1 },
      },
      create: {
        key: 'global_counter',
        value: 1,
      },
    })
  },
}
