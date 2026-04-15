import { NextRequest, NextResponse } from 'next/server'

import { discordService } from '@/lib/services/discord-service'
import { verifyDiscordRequest } from '@/lib/discord/verify'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-signature-ed25519')
  const timestamp = request.headers.get('x-signature-timestamp')
  const body = await request.text()

  if (!signature || !timestamp) {
    return NextResponse.json(
      { error: 'Missing Discord signature headers.' },
      { status: 401 }
    )
  }

  const isValidRequest = await verifyDiscordRequest({
    body,
    signature,
    timestamp,
  })

  if (!isValidRequest) {
    return NextResponse.json({ error: 'Invalid Discord request signature.' }, { status: 401 })
  }

  const interaction = JSON.parse(body) as Parameters<
    typeof discordService.handleInteraction
  >[0]
  const response = await discordService.handleInteraction(interaction)

  return NextResponse.json(response)
}
