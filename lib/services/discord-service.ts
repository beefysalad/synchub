import prisma from '@/lib/prisma'
import { accountLinkService } from '@/lib/services/account-link-service'
import { chatGithubOverviewService } from '@/lib/services/chat-github-overview-service'
import { pendingLinkService } from '@/lib/services/pending-link-service'

type DiscordInteraction = {
  type?: number
  data?: {
    name?: string
    options?: Array<{
      name?: string
      value?: string
    }>
  }
  member?: {
    user?: {
      id?: string
      username?: string
    }
  }
  user?: {
    id?: string
    username?: string
  }
  channel_id?: string
  guild_id?: string
}

function getInteractionUser(interaction: DiscordInteraction) {
  return interaction.member?.user ?? interaction.user ?? null
}

function getOptionValue(interaction: DiscordInteraction, optionName: string) {
  return (
    interaction.data?.options?.find((option) => option.name === optionName)?.value ??
    null
  )
}

function messageResponse(content: string) {
  return {
    type: 4,
    data: {
      content,
    },
  }
}

async function findDiscordAccount(discordUserId: string) {
  return prisma.linkedAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: 'DISCORD',
        providerUserId: discordUserId,
      },
    },
    include: {
      user: {
        include: {
          linkedAccounts: true,
        },
      },
    },
  })
}

export const discordService = {
  async handleInteraction(interaction: DiscordInteraction) {
    if (interaction.type === 1) {
      return { type: 1 }
    }

    const commandName = interaction.data?.name

    switch (commandName) {
      case 'link': {
        const code = getOptionValue(interaction, 'code')
        const discordUser = getInteractionUser(interaction)

        if (!code) {
          return messageResponse('Please provide a link code.')
        }

        const pendingLink = await pendingLinkService.consumeLinkToken(code, 'DISCORD')

        if (!pendingLink || !discordUser?.id) {
          return messageResponse('That link code is invalid or has expired.')
        }

        await accountLinkService.upsertLinkedAccount({
          userId: pendingLink.userId,
          provider: 'DISCORD',
          providerUserId: discordUser.id,
          username: discordUser.username ?? null,
          chatId: interaction.channel_id ?? null,
          metadata: {
            guildId: interaction.guild_id ?? null,
            linkedVia: 'slash-command',
          },
        })

        return messageResponse(
          'Discord account linked successfully. You can now use /whoami and /status here.'
        )
      }

      case 'whoami': {
        const discordUser = getInteractionUser(interaction)

        if (!discordUser?.id) {
          return messageResponse('Could not determine the Discord user for this request.')
        }

        const account = await findDiscordAccount(discordUser.id)

        if (!account) {
          return messageResponse(
            'This Discord account is not linked yet. Open SyncHub and click "Connect Discord" first.'
          )
        }

        return messageResponse(
          [
            `Linked Discord account: ${account.username ?? discordUser.username ?? discordUser.id}`,
            `SyncHub user id: ${account.userId}`,
            `Connected providers: ${account.user.linkedAccounts.map((item) => item.provider).join(', ')}`,
          ].join('\n')
        )
      }

      case 'status': {
        const discordUser = getInteractionUser(interaction)

        if (!discordUser?.id) {
          return messageResponse('Could not determine the Discord user for this request.')
        }

        const account = await findDiscordAccount(discordUser.id)

        if (!account) {
          return messageResponse(
            'No SyncHub link found for this Discord account. Use the dashboard to connect Discord first.'
          )
        }

        const providers = new Set(account.user.linkedAccounts.map((item) => item.provider))

        return messageResponse(
          [
            'SyncHub integration status:',
            `Discord: ${providers.has('DISCORD') ? 'connected' : 'not connected'}`,
            `GitHub: ${providers.has('GITHUB') ? 'connected' : 'not connected'}`,
            `Telegram: ${providers.has('TELEGRAM') ? 'connected' : 'not connected'}`,
          ].join('\n')
        )
      }

      case 'issues': {
        const discordUser = getInteractionUser(interaction)

        if (!discordUser?.id) {
          return messageResponse('Could not determine the Discord user for this request.')
        }

        const account = await findDiscordAccount(discordUser.id)

        if (!account) {
          return messageResponse(
            'This Discord account is not linked yet. Open SyncHub and click "Connect Discord" first.'
          )
        }

        try {
          const summary = await chatGithubOverviewService.getOpenIssuesSummary({
            userId: account.userId,
            repository: getOptionValue(interaction, 'repo'),
          })

          return messageResponse(summary)
        } catch (error) {
          return messageResponse(
            error instanceof Error
              ? error.message
              : 'Unable to load open issues right now.'
          )
        }
      }

      case 'pulls': {
        const discordUser = getInteractionUser(interaction)

        if (!discordUser?.id) {
          return messageResponse('Could not determine the Discord user for this request.')
        }

        const account = await findDiscordAccount(discordUser.id)

        if (!account) {
          return messageResponse(
            'This Discord account is not linked yet. Open SyncHub and click "Connect Discord" first.'
          )
        }

        try {
          const summary = await chatGithubOverviewService.getOpenPullsSummary({
            userId: account.userId,
            repository: getOptionValue(interaction, 'repo'),
          })

          return messageResponse(summary)
        } catch (error) {
          return messageResponse(
            error instanceof Error
              ? error.message
              : 'Unable to load open pull requests right now.'
          )
        }
      }

      default:
        return messageResponse(
          'SyncHub received the interaction, but only `/link`, `/whoami`, `/status`, `/issues`, and `/pulls` are wired in this MVP route.'
        )
    }
  },
}
