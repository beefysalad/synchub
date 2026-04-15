import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { registerDiscordCommands } from '@/lib/discord/api'

export async function GET(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await registerDiscordCommands()

    return NextResponse.redirect(
      new URL('/integrations?discordCommands=registered', request.url)
    )
  } catch (error) {
    const reason = encodeURIComponent(
      error instanceof Error ? error.message : 'Unable to register Discord commands'
    )

    return NextResponse.redirect(
      new URL(`/integrations?discordCommands=error&reason=${reason}`, request.url)
    )
  }
}
