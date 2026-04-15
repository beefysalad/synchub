import { auth, currentUser } from '@clerk/nextjs/server'

import prisma from '@/lib/prisma'

export async function getOrCreateCurrentUserRecord() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  return prisma.user.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: { clerkUserId: userId },
  })
}

export async function getCurrentClerkUserProfile() {
  const user = await currentUser()

  if (!user) {
    return null
  }

  return {
    id: user.id,
    primaryEmail:
      user.emailAddresses.find(
        (emailAddress) => emailAddress.id === user.primaryEmailAddressId
      )?.emailAddress ?? null,
    username: user.username ?? null,
    externalAccounts: user.externalAccounts,
  }
}
