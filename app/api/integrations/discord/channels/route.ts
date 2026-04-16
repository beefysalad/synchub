import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { discordChannelsService } from '@/lib/services/discord-channels-service'

export async function GET() {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const channels = await discordChannelsService.listUserDiscordChannels(clerkUserId)
    return NextResponse.json({ channels })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to list Discord channels'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
