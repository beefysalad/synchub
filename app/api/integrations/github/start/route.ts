import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { createGitHubOAuthAuthorizeUrl } from '@/lib/github/oauth'
import prisma from '@/lib/prisma'
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

  const { token } = await pendingLinkService.createLinkToken(
    user.id,
    'GITHUB',
    10,
    {
      purpose: 'github-oauth',
    }
  )

  const authorizeUrl = createGitHubOAuthAuthorizeUrl(token)

  return NextResponse.redirect(authorizeUrl)
}
