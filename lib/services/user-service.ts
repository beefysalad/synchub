import type { User as ClerkUser, UserJSON } from '@clerk/nextjs/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { Prisma } from '@/app/generated/prisma/client'

import { userRepository } from '@/lib/repositories/user-repository'

type SyncableClerkUser = {
  clerkId: string
  email: string
  name: string | null
  imageUrl: string | null
  emailVerified: Date | null
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const buildName = (parts: Array<string | null | undefined>) => {
  const value = parts.filter(Boolean).join(' ').trim()
  return value.length > 0 ? value : null
}

const getVerifiedAt = (verified: boolean) => (verified ? new Date() : null)

const mapClerkUser = (user: ClerkUser): SyncableClerkUser | null => {
  const primaryEmail =
    user.emailAddresses.find(
      (emailAddress) => emailAddress.id === user.primaryEmailAddressId
    ) ?? user.emailAddresses[0]

  if (!primaryEmail?.emailAddress) {
    return null
  }

  return {
    clerkId: user.id,
    email: normalizeEmail(primaryEmail.emailAddress),
    name:
      user.fullName ??
      buildName([user.firstName, user.lastName]) ??
      user.username ??
      null,
    imageUrl: user.imageUrl ?? null,
    emailVerified: getVerifiedAt(
      primaryEmail.verification?.status === 'verified'
    ),
  }
}

const mapClerkWebhookUser = (user: UserJSON): SyncableClerkUser | null => {
  const primaryEmail =
    user.email_addresses.find(
      (emailAddress) => emailAddress.id === user.primary_email_address_id
    ) ?? user.email_addresses[0]

  if (!primaryEmail?.email_address) {
    return null
  }

  return {
    clerkId: user.id,
    email: normalizeEmail(primaryEmail.email_address),
    name:
      buildName([user.first_name, user.last_name]) ??
      user.username ??
      null,
    imageUrl: user.image_url ?? null,
    emailVerified: getVerifiedAt(
      primaryEmail.verification?.status === 'verified'
    ),
  }
}

export const userService = {
  async upsertClerkUser(input: SyncableClerkUser) {
    try {
      return await userRepository.upsertByClerkId({
        clerkId: input.clerkId,
        email: input.email,
        name: input.name,
        image: input.imageUrl,
        emailVerified: input.emailVerified,
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existingByEmail = await userRepository.findByEmail(input.email)

        if (!existingByEmail) {
          throw error
        }

        return userRepository.linkClerkIdentityByEmail({
          userId: existingByEmail.id,
          clerkId: input.clerkId,
          name: input.name,
          image: input.imageUrl,
          emailVerified: input.emailVerified,
          currentName: existingByEmail.name,
          currentEmailVerified: existingByEmail.emailVerified,
        })
      }

      throw error
    }
  },

  async syncCurrentUserToDatabase() {
    const { userId } = await auth()

    if (!userId) {
      return null
    }

    const clerkUser = await currentUser()

    if (!clerkUser) {
      return null
    }

    const mappedUser = mapClerkUser(clerkUser)

    if (!mappedUser) {
      return null
    }

    return userService.upsertClerkUser(mappedUser)
  },

  async syncWebhookUserToDatabase(user: UserJSON) {
    const mappedUser = mapClerkWebhookUser(user)

    if (!mappedUser) {
      return null
    }

    return userService.upsertClerkUser(mappedUser)
  },

  async deleteClerkUserFromDatabase(clerkId: string) {
    const existingUser = await userRepository.findByClerkId(clerkId)

    if (!existingUser) {
      return null
    }

    return userRepository.deleteById(existingUser.id)
  },
}
