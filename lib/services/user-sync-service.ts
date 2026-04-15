import type { WebhookEvent } from '@clerk/nextjs/server'

import prisma from '@/lib/prisma'

type ClerkWebhookUser = Extract<
  WebhookEvent,
  { type: 'user.created' | 'user.updated' }
>['data']

function getGitHubAccount(user: ClerkWebhookUser) {
  return user.external_accounts?.find(
    (account) =>
      account.provider === 'oauth_github' ||
      account.provider === 'github' ||
      account.provider === 'oidc_github'
  )
}

export const userSyncService = {
  async syncClerkUser(user: ClerkWebhookUser) {
    const syncedUser = await prisma.user.upsert({
      where: {
        clerkUserId: user.id,
      },
      update: {},
      create: {
        clerkUserId: user.id,
      },
    })

    const githubAccount = getGitHubAccount(user)

    if (githubAccount?.provider_user_id) {
      await prisma.linkedAccount.upsert({
        where: {
          provider_providerUserId: {
            provider: 'GITHUB',
            providerUserId: githubAccount.provider_user_id,
          },
        },
        update: {
          userId: syncedUser.id,
          username:
            githubAccount.username ??
            githubAccount.email_address ??
            user.username ??
            null,
          metadata: {
            provider: githubAccount.provider,
            avatarUrl: githubAccount.image_url,
            email: githubAccount.email_address,
            scopes: githubAccount.approved_scopes ?? [],
            clerkExternalAccountId: githubAccount.id,
          },
        },
        create: {
          userId: syncedUser.id,
          provider: 'GITHUB',
          providerUserId: githubAccount.provider_user_id,
          username:
            githubAccount.username ??
            githubAccount.email_address ??
            user.username ??
            null,
          metadata: {
            provider: githubAccount.provider,
            avatarUrl: githubAccount.image_url,
            email: githubAccount.email_address,
            scopes: githubAccount.approved_scopes ?? [],
            clerkExternalAccountId: githubAccount.id,
          },
        },
      })
    }

    return syncedUser
  },

  async deleteByClerkUserId(clerkUserId: string) {
    await prisma.user.deleteMany({
      where: {
        clerkUserId,
      },
    })
  },
}
