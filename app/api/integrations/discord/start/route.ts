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

  return NextResponse.json({
    code: token,
    expiresAt,
    instructions: formatDiscordLinkInstructions(token),
  })
}
