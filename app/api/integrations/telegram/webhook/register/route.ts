import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { setTelegramWebhook } from '@/lib/telegram/api'
import { getTelegramWebhookUrl } from '@/lib/telegram/linking'

export async function GET(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const webhookUrl = getTelegramWebhookUrl()
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET

    await setTelegramWebhook(webhookUrl, secretToken)

    return NextResponse.redirect(
      new URL('/integrations?telegramWebhook=registered', request.url)
    )
  } catch (error) {
    const reason = encodeURIComponent(
      error instanceof Error ? error.message : 'Unable to register Telegram webhook'
    )

    return NextResponse.redirect(
      new URL(`/integrations?telegramWebhook=error&reason=${reason}`, request.url)
    )
  }
}
