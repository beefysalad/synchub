import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { formatDiscordLinkInstructions } from '@/lib/discord/linking'
import { pendingLinkService } from '@/lib/services/pending-link-service'

export async function GET() {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.upsert({
    where: { clerkUserId },
    update: {},
    create: { clerkUserId },
  })

  const { token, expiresAt } = await pendingLinkService.createLinkToken(
    user.id,
    'DISCORD'
  )

  const redirectUrl = new URL('/integrations', process.env.NEXT_PUBLIC_APP_URL)
  redirectUrl.searchParams.set('discordCode', token)
  redirectUrl.searchParams.set('discordExpiresAt', expiresAt.toISOString())
  redirectUrl.searchParams.set('discordInstructions', formatDiscordLinkInstructions(token))

  return NextResponse.redirect(redirectUrl)
}
