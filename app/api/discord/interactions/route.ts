import { NextRequest, NextResponse } from 'next/server'

import { accountLinkService } from '@/lib/services/account-link-service'
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

function getOptionValue(interaction: DiscordInteraction, optionName: string) {
  return (
    interaction.data?.options?.find((option) => option.name === optionName)?.value ??
    null
  )
}

export async function POST(request: NextRequest) {
  const interaction = (await request.json()) as DiscordInteraction

  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 })
  }

  const commandName = interaction.data?.name

  if (commandName !== 'link') {
    return NextResponse.json({
      type: 4,
      data: {
        content: 'SyncHub received the interaction, but only `/link` is wired in this MVP route.',
      },
    })
  }

  const code = getOptionValue(interaction, 'code')

  if (!code) {
    return NextResponse.json({
      type: 4,
      data: {
        content: 'Please provide a link code.',
      },
    })
  }

  const pendingLink = await pendingLinkService.consumeLinkToken(code, 'DISCORD')
  const discordUser = interaction.member?.user ?? interaction.user

  if (!pendingLink || !discordUser?.id) {
    return NextResponse.json({
      type: 4,
      data: {
        content: 'That link code is invalid or has expired.',
      },
    })
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

  return NextResponse.json({
    type: 4,
    data: {
      content: 'Discord account linked successfully. You can now use SyncHub commands here.',
    },
  })
}
