import { NextRequest, NextResponse } from 'next/server'

import { telegramService } from '@/lib/services/telegram-service'

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number
      username?: string
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
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
  }

  const payload = (await request.json()) as TelegramUpdate

  if (!payload.message) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  try {
    await telegramService.handleIncomingMessage(payload.message)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to process Telegram update'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
