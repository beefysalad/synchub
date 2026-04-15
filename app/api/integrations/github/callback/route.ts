import { NextRequest, NextResponse } from 'next/server'

import {
  exchangeGitHubCodeForToken,
  fetchGitHubOAuthUser,
} from '@/lib/github/oauth'
import { accountLinkService } from '@/lib/services/account-link-service'
import { pendingLinkService } from '@/lib/services/pending-link-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/integrations?github=error`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: 'Missing GitHub OAuth callback parameters.' },
      { status: 400 }
    )
  }

  const pendingLink = await pendingLinkService.consumeLinkToken(state, 'GITHUB')

  if (!pendingLink) {
    return NextResponse.json(
      { error: 'The GitHub authorization state is invalid or expired.' },
      { status: 400 }
    )
  }

  try {
    const tokenResponse = await exchangeGitHubCodeForToken(code)
    const githubUser = await fetchGitHubOAuthUser(tokenResponse.access_token)

    await accountLinkService.upsertLinkedAccount({
      userId: pendingLink.userId,
      provider: 'GITHUB',
      providerUserId: String(githubUser.id),
      username: githubUser.login,
      accessToken: tokenResponse.access_token,
      metadata: {
        source: 'github-oauth',
        profileUrl: githubUser.html_url,
        avatarUrl: githubUser.avatar_url,
        displayName: githubUser.name,
        scopes: tokenResponse.scope
          .split(',')
          .map((scope) => scope.trim())
          .filter(Boolean),
        tokenType: tokenResponse.token_type,
      },
    })

    return NextResponse.redirect(
      new URL('/integrations?github=connected', request.url)
    )
  } catch {
    return NextResponse.redirect(
      new URL('/integrations?github=error', request.url)
    )
  }
}
