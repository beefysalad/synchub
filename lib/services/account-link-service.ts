import type { Prisma } from '@/app/generated/prisma/client'

import prisma from '@/lib/prisma'

type LinkInput = {
  userId: string
  provider: 'GITHUB' | 'TELEGRAM' | 'DISCORD'
  providerUserId: string
  username?: string | null
  accessToken?: string | null
  refreshToken?: string | null
  chatId?: string | null
  metadata?: Record<string, unknown>
}

export const accountLinkService = {
  async upsertLinkedAccount(input: LinkInput) {
    const metadata = (input.metadata ?? {}) as Prisma.InputJsonValue

    return prisma.linkedAccount.upsert({
      where: {
        provider_providerUserId: {
          provider: input.provider,
          providerUserId: input.providerUserId,
        },
      },
      update: {
        userId: input.userId,
        username: input.username ?? null,
        accessToken: input.accessToken ?? null,
        refreshToken: input.refreshToken ?? null,
        chatId: input.chatId ?? null,
        metadata,
      },
      create: {
        userId: input.userId,
        provider: input.provider,
        providerUserId: input.providerUserId,
        username: input.username ?? null,
        accessToken: input.accessToken ?? null,
        refreshToken: input.refreshToken ?? null,
        chatId: input.chatId ?? null,
        metadata,
      },
    })
  },
}
