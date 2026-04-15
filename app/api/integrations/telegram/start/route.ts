import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { pendingLinkService } from '@/lib/services/pending-link-service'
import { buildTelegramDeepLink } from '@/lib/telegram/linking'

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

  const { token } = await pendingLinkService.createLinkToken(user.id, 'TELEGRAM')
  const deepLink = buildTelegramDeepLink(token)

  return NextResponse.redirect(deepLink)
}
