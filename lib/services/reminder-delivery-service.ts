import { AccountProvider, ReminderStatus } from '@/app/generated/prisma/client'

import { buildReminderDeliveryMessage } from '@/lib/github/notification-messages'
import prisma from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram/api'

async function sendDiscordMessage({
  channelId,
  content,
  embeds,
}: {
  channelId: string
  content: string
  embeds?: Array<Record<string, unknown>>
}) {
  const botToken = process.env.DISCORD_BOT_TOKEN

  if (!botToken) {
    throw new Error('DISCORD_BOT_TOKEN is not configured.')
  }

  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        embeds: embeds ?? [],
        allowed_mentions: {
          parse: [],
        },
      }),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Discord reminder delivery failed: ${errorBody}`)
  }
}

export const reminderDeliveryService = {
  async dispatchDueReminders() {
    const dueReminders = await prisma.reminder.findMany({
      where: {
        status: 'PENDING',
        remindAt: {
          lte: new Date(),
        },
      },
      include: {
        user: {
          include: {
            linkedAccounts: true,
          },
        },
      },
      orderBy: {
        remindAt: 'asc',
      },
    })

    let sentCount = 0
    let failedCount = 0

    for (const reminder of dueReminders) {
      const linkedTargets = reminder.user.linkedAccounts.filter(
        (account) =>
          (account.provider === AccountProvider.TELEGRAM ||
            account.provider === AccountProvider.DISCORD) &&
          Boolean(account.chatId)
      )

      if (!linkedTargets.length) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.FAILED },
        })
        failedCount += 1
        continue
      }

      const message = buildReminderDeliveryMessage(reminder)

      try {
        await Promise.all(
          linkedTargets.map((account) => {
            if (!account.chatId) {
              return Promise.resolve()
            }

            if (account.provider === AccountProvider.TELEGRAM) {
              return sendTelegramMessage({
                chatId: account.chatId,
                text: message.telegramText,
                parseMode: 'HTML',
              })
            }

            return sendDiscordMessage({
              channelId: account.chatId,
              content: message.discordContent,
              embeds: message.discordEmbeds,
            })
          })
        )

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.SENT },
        })
        sentCount += 1
      } catch (error) {
        console.error(`Reminder delivery failed for ${reminder.id}:`, error)
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.FAILED },
        })
        failedCount += 1
      }
    }

    return {
      processed: dueReminders.length,
      sent: sentCount,
      failed: failedCount,
    }
  },
}
