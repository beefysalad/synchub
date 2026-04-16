import { AccountProvider } from '@/app/generated/prisma/client'
import { listDiscordGuildTextChannels } from '@/lib/discord/api'
import prisma from '@/lib/prisma'

export const discordChannelsService = {
  async listUserDiscordChannels(clerkUserId: string) {
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        linkedAccounts: {
          where: { provider: AccountProvider.DISCORD },
        },
      },
    })

    if (!user || user.linkedAccounts.length === 0) {
      return []
    }

    const linkedAccount = user.linkedAccounts[0]
    const metadata =
      linkedAccount.metadata && typeof linkedAccount.metadata === 'object'
        ? (linkedAccount.metadata as Record<string, unknown>)
        : null

    const guildId = typeof metadata?.guildId === 'string' ? metadata.guildId : null

    if (!guildId || !process.env.DISCORD_BOT_TOKEN) {
      return []
    }

    try {
      return await listDiscordGuildTextChannels(guildId)
    } catch (error) {
      console.error('Failed to list Discord channels:', error)
      return []
    }
  },
}
