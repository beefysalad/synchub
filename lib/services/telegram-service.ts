import prisma from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram/api'
import { accountLinkService } from '@/lib/services/account-link-service'
import { pendingLinkService } from '@/lib/services/pending-link-service'

type TelegramMessage = {
  chat?: {
    id?: number
    type?: string
  }
  from?: {
    id?: number
    username?: string
    first_name?: string
    last_name?: string
  }
  text?: string
}

function extractStartToken(text?: string) {
  if (!text) {
    return null
  }

  const [command, token] = text.trim().split(/\s+/, 2)

  if (command !== '/start' || !token) {
    return null
  }

  return token
}

function getCommand(text?: string) {
  if (!text) {
    return null
  }

  const [command] = text.trim().split(/\s+/, 1)
  return command ?? null
}

function getTelegramDisplayName(message: TelegramMessage) {
  const fullName = [message.from?.first_name, message.from?.last_name]
    .filter(Boolean)
    .join(' ')

  return message.from?.username || fullName || 'there'
}

async function findTelegramAccount(telegramUserId: string) {
  return prisma.linkedAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: 'TELEGRAM',
        providerUserId: telegramUserId,
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

async function handleStartCommand(message: TelegramMessage) {
  const chatId = message.chat?.id
  const telegramUserId = message.from?.id
  const token = extractStartToken(message.text)

  if (!chatId || !telegramUserId) {
    return
  }

  if (!token) {
    await sendTelegramMessage({
      chatId,
      text:
        'Welcome to SyncHub. Open the web dashboard and click "Connect Telegram" to link this account.',
    })
    return
  }

  const pendingLink = await pendingLinkService.consumeLinkToken(token, 'TELEGRAM')

  if (!pendingLink) {
    await sendTelegramMessage({
      chatId,
      text:
        'That link token is invalid or has expired. Return to SyncHub and click "Connect Telegram" again.',
    })
    return
  }

  await accountLinkService.upsertLinkedAccount({
    userId: pendingLink.userId,
    provider: 'TELEGRAM',
    providerUserId: String(telegramUserId),
    username: message.from?.username ?? null,
    chatId: String(chatId),
    metadata: {
      chatType: message.chat?.type ?? null,
      firstName: message.from?.first_name ?? null,
      lastName: message.from?.last_name ?? null,
      linkedVia: 'telegram-start',
    },
  })

  await sendTelegramMessage({
    chatId,
    text:
      'Telegram connected successfully. You can now use /help, /whoami, and /status here.',
  })
}

async function handleHelpCommand(message: TelegramMessage) {
  const chatId = message.chat?.id

  if (!chatId) {
    return
  }

  await sendTelegramMessage({
    chatId,
    text: [
      'SyncHub Telegram commands:',
      '/start - Start or complete account linking',
      '/help - Show available commands',
      '/whoami - Show the linked SyncHub identity for this Telegram account',
      '/status - Show which integrations are connected for this user',
    ].join('\n'),
  })
}

async function handleWhoAmICommand(message: TelegramMessage) {
  const chatId = message.chat?.id
  const telegramUserId = message.from?.id

  if (!chatId || !telegramUserId) {
    return
  }

  const account = await findTelegramAccount(String(telegramUserId))

  if (!account) {
    await sendTelegramMessage({
      chatId,
      text:
        'This Telegram account is not linked yet. Open SyncHub and click "Connect Telegram" first.',
    })
    return
  }

  await sendTelegramMessage({
    chatId,
    text: [
      `Linked Telegram account: ${
        account.username ? `@${account.username}` : getTelegramDisplayName(message)
      }`,
      `SyncHub user id: ${account.userId}`,
      `Connected providers: ${account.user.linkedAccounts.map((item) => item.provider).join(', ')}`,
    ].join('\n'),
  })
}

async function handleStatusCommand(message: TelegramMessage) {
  const chatId = message.chat?.id
  const telegramUserId = message.from?.id

  if (!chatId || !telegramUserId) {
    return
  }

  const account = await findTelegramAccount(String(telegramUserId))

  if (!account) {
    await sendTelegramMessage({
      chatId,
      text:
        'No SyncHub link found for this Telegram account. Use the dashboard to connect Telegram first.',
    })
    return
  }

  const providers = new Set(account.user.linkedAccounts.map((item) => item.provider))

  await sendTelegramMessage({
    chatId,
    text: [
      'SyncHub integration status:',
      `Telegram: ${providers.has('TELEGRAM') ? 'connected' : 'not connected'}`,
      `GitHub: ${providers.has('GITHUB') ? 'connected' : 'not connected'}`,
      `Discord: ${providers.has('DISCORD') ? 'connected' : 'not connected'}`,
    ].join('\n'),
  })
}

async function handleUnknownCommand(message: TelegramMessage) {
  const chatId = message.chat?.id

  if (!chatId) {
    return
  }

  await sendTelegramMessage({
    chatId,
    text: 'Unknown command. Use /help to see what SyncHub supports right now.',
  })
}

export const telegramService = {
  async handleIncomingMessage(message: TelegramMessage) {
    const command = getCommand(message.text)

    switch (command) {
      case '/start':
        await handleStartCommand(message)
        return
      case '/help':
        await handleHelpCommand(message)
        return
      case '/whoami':
        await handleWhoAmICommand(message)
        return
      case '/status':
        await handleStatusCommand(message)
        return
      default:
        await handleUnknownCommand(message)
    }
  },
}
