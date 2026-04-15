import prisma from '@/lib/prisma'

import type { User } from '@/app/generated/prisma/client'

export const userRepository = {
  findByClerkId(clerkId: string) {
    return prisma.user.findUnique({
      where: { clerkId },
    })
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    })
  },

  upsertByClerkId(input: {
    clerkId: string
    email: string
    name: string | null
    image: string | null
    emailVerified: Date | null
  }) {
    return prisma.user.upsert({
      where: { clerkId: input.clerkId },
      update: {
        email: input.email,
        name: input.name,
        image: input.image,
        emailVerified: input.emailVerified,
      },
      create: {
        clerkId: input.clerkId,
        email: input.email,
        name: input.name,
        image: input.image,
        emailVerified: input.emailVerified,
        hashedPassword: null,
      },
    })
  },

  linkClerkIdentityByEmail(input: {
    userId: string
    clerkId: string
    name: string | null
    image: string | null
    emailVerified: Date | null
    currentName: string | null
    currentEmailVerified: Date | null
  }) {
    return prisma.user.update({
      where: { id: input.userId },
      data: {
        clerkId: input.clerkId,
        name: input.name ?? input.currentName,
        image: input.image,
        emailVerified: input.emailVerified ?? input.currentEmailVerified,
      },
    })
  },

  deleteById(id: string) {
    return prisma.user.delete({
      where: { id },
    })
  },
} satisfies Record<string, (...args: never[]) => Promise<User | null> | Promise<User>>
