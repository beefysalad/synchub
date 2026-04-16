import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram/api'
import { buildGithubNotificationMessage } from '@/lib/github/notification-messages'

function getGitHubWebhookSecret() {
  return (
    process.env.GITHUB_WEBHOOK_SECRET ||
    process.env.GITHUB_CLIENT_SECRET ||
    'synchub-secret-local'
  )
}

export async function POST(request: NextRequest) {
  const eventName = request.headers.get('x-github-event')
  const signature = request.headers.get('x-hub-signature-256')

  if (!eventName) {
    return NextResponse.json({ error: 'Missing event header' }, { status: 400 })
  }

  try {
    const rawBody = await request.text()

    const webhookSecret = getGitHubWebhookSecret()
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 })
    }

    const hmac = crypto.createHmac('sha256', webhookSecret)
    const digest = `sha256=${hmac.update(rawBody).digest('hex')}`
    const isValidSignature =
      signature.length === digest.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))

    if (!isValidSignature) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const repositoryFullName = payload.repository?.full_name

    if (!repositoryFullName) {
      return NextResponse.json({ success: true, message: 'Ignored: No repository context' })
    }

    // Identify if we track this repo
    const trackedRepos = await prisma.trackedRepo.findMany({
      where: { fullName: repositoryFullName },
      include: {
        notificationRules: true,
        user: {
          include: {
            linkedAccounts: true,
          },
        },
      },
    })

    if (!trackedRepos.length) {
      return NextResponse.json({ success: true, message: 'Ignored: Repo not tracked by any user' })
    }

    const message = buildGithubNotificationMessage({
      eventName,
      payload,
      repositoryFullName,
    })

    if (!message) {
      return NextResponse.json({ success: true, message: `Ignored action ${payload.action} for event ${eventName}` })
    }

    // Dispatch notifications!
    for (const tracker of trackedRepos) {
      const rules = tracker.notificationRules.filter((rule) =>
        rule.events.includes(eventName)
      )

      for (const rule of rules) {
        const linkedAccount = tracker.user.linkedAccounts.find(
          (acc) => acc.provider === rule.provider
        )

        if (linkedAccount) {
          try {
            if (rule.provider === 'TELEGRAM') {
              if (!linkedAccount.chatId) {
                continue
              }

              await sendTelegramMessage({
                chatId: linkedAccount.chatId,
                text: message.telegramText,
                parseMode: 'HTML',
                disableWebPagePreview:
                  message.telegramDisablePreview ?? true,
              })
            } else if (rule.provider === 'DISCORD') {
              const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
              const channelOverrides =
                rule.channelOverrides && typeof rule.channelOverrides === 'object'
                  ? (rule.channelOverrides as Record<string, unknown>)
                  : null
              const overrideChannelId =
                channelOverrides && typeof channelOverrides[eventName] === 'string'
                  ? channelOverrides[eventName]
                  : null
              const targetChannelId = overrideChannelId ?? linkedAccount.chatId

              if (DISCORD_BOT_TOKEN && targetChannelId) {
                await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    content: message.discordContent,
                    embeds: message.discordEmbeds ?? [],
                    allowed_mentions: {
                      parse: [],
                    },
                  }),
                })
              }
            }
          } catch (err) {
            console.error(`Failed pushing to ${rule.provider} for user ${tracker.userId}`, err)
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing failed:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
