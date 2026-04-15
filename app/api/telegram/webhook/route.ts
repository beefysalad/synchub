import { NextRequest, NextResponse } from 'next/server'

import { accountLinkService } from '@/lib/services/account-link-service'
import { pendingLinkService } from '@/lib/services/pending-link-service'

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

function extractStartToken(text?: string) {
  if (!text?.startsWith('/start ')) {
    return null
  }

  return text.replace('/start ', '').trim() || null
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
  }

  const payload = (await request.json()) as TelegramUpdate
  const token = extractStartToken(payload.message?.text)

  if (!token) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const pendingLink = await pendingLinkService.consumeLinkToken(token, 'TELEGRAM')

  if (!pendingLink || !payload.message?.from?.id) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  await accountLinkService.upsertLinkedAccount({
    userId: pendingLink.userId,
    provider: 'TELEGRAM',
    providerUserId: String(payload.message.from.id),
    username: payload.message.from.username ?? null,
    chatId: payload.message.chat?.id ? String(payload.message.chat.id) : null,
    metadata: {
      chatType: payload.message.chat?.type ?? null,
      firstName: payload.message.from.first_name ?? null,
      lastName: payload.message.from.last_name ?? null,
    },
  })

  return NextResponse.json({ ok: true, linked: true })
}
