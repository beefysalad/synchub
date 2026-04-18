import { AccountProvider, ReminderStatus } from '@/app/generated/prisma/client'

import { sendDiscordMessage } from '@/lib/discord/api'
import { buildReminderDeliveryMessage } from '@/lib/github/notification-messages'
import prisma from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram/api'

export const reminderDeliveryService = {
  async dispatchDueReminders() {
    const dueReminders = await prisma.reminder.findMany({
      where: {
        status: 'PENDING',
        archived: false,
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

            const metadata =
              account.metadata && typeof account.metadata === 'object'
                ? (account.metadata as Record<string, unknown>)
                : {}
            const preferredChannelId =
              typeof metadata.reminderChannelId === 'string'
                ? metadata.reminderChannelId
                : null

            return sendDiscordMessage({
              channelId: preferredChannelId || account.chatId,
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
