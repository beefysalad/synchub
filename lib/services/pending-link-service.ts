import { randomBytes } from 'crypto'
import { addMinutes, isAfter } from 'date-fns'

import prisma from '@/lib/prisma'

type LinkProvider = 'TELEGRAM' | 'DISCORD'

function createOpaqueToken(size = 24) {
  return randomBytes(size).toString('base64url')
}

export const pendingLinkService = {
  async createLinkToken(userId: string, provider: LinkProvider, ttlMinutes = 15) {
    const token = createOpaqueToken()
    const expiresAt = addMinutes(new Date(), ttlMinutes)

    await prisma.pendingLink.create({
      data: {
        token,
        provider,
        userId,
        expiresAt,
      },
    })

    return {
      token,
      expiresAt,
    }
  },

  async consumeLinkToken(token: string, provider: LinkProvider) {
    const pendingLink = await prisma.pendingLink.findUnique({
      where: { token },
    })

    if (
      !pendingLink ||
      pendingLink.provider !== provider ||
      pendingLink.consumedAt ||
      isAfter(new Date(), pendingLink.expiresAt)
    ) {
      return null
    }

    await prisma.pendingLink.update({
      where: { id: pendingLink.id },
      data: {
        consumedAt: new Date(),
      },
    })

    return pendingLink
  },
}
