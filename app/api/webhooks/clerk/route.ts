import type { WebhookEvent } from '@clerk/nextjs/server'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest, NextResponse } from 'next/server'

import { userSyncService } from '@/lib/services/user-sync-service'

export async function POST(request: NextRequest) {
  let event: WebhookEvent

  try {
    event = await verifyWebhook(request)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to verify webhook'

    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        await userSyncService.syncClerkUser(event.data)
        break
      case 'user.deleted':
        if (event.data.id) {
          await userSyncService.deleteByClerkUserId(event.data.id)
        }
        break
      default:
        break
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to process webhook'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
