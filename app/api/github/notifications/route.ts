import { auth } from '@clerk/nextjs/server'
import { AccountProvider, Prisma } from '@/app/generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { listDiscordGuildTextChannels } from '@/lib/discord/api'
import { githubRepositoryService } from '@/lib/github/repositories'
import {
  githubWebhookService,
  SUPPORTED_GITHUB_WEBHOOK_EVENTS,
} from '@/lib/github/webhooks'
import prisma from '@/lib/prisma'

const WebhookSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  provider: z.nativeEnum(AccountProvider),
  events: z.array(z.enum(SUPPORTED_GITHUB_WEBHOOK_EVENTS)),
  channelOverrides: z
    .partialRecord(
      z.enum(SUPPORTED_GITHUB_WEBHOOK_EVENTS),
      z.string().trim().min(1)
    )
    .optional(),
})

export async function POST(request: NextRequest) {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { owner, repo, provider, events, channelOverrides } =
      WebhookSchema.parse(body)

    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, {
        owner,
        repo,
      })

    const trackedRepo = await prisma.trackedRepo.findUnique({
      where: {
        userId_fullName: {
          userId: user.id,
          fullName: `${validatedRepository.owner}/${validatedRepository.repo}`,
        },
      },
    })

    if (!trackedRepo) {
      return NextResponse.json(
        { error: 'Repository is not currently tracked' },
        { status: 400 }
      )
    }

    // Step 1: Ensure user actually has this provider linked securely
    const linkedAccount = await prisma.linkedAccount.findFirst({
      where: { userId: user.id, provider },
    })

    if (!linkedAccount) {
      return NextResponse.json(
        { error: `You must link your ${provider} account first.` },
        { status: 400 }
      )
    }

    if (events.length === 0) {
      // Deactivate the rule entirely
      await prisma.notificationRule.deleteMany({
        where: { repoId: trackedRepo.id, provider },
      })
      return NextResponse.json({ success: true, message: 'Notifications disabled' })
    }

    // Step 2: Upsert Notification Rule
    await prisma.notificationRule.upsert({
      where: {
        repoId_provider: {
          repoId: trackedRepo.id,
          provider,
        },
      },
      update: {
        events,
        channelOverrides:
          provider === AccountProvider.DISCORD
            ? channelOverrides ?? Prisma.JsonNull
            : Prisma.JsonNull,
      },
      create: {
        userId: user.id,
        repoId: trackedRepo.id,
        provider,
        events,
        ...(provider === AccountProvider.DISCORD
          ? { channelOverrides: channelOverrides ?? undefined }
          : {}),
      },
    })

    // Step 3: Trigger GitHub API Webhook Installation
    // We bind a unified hook for SyncHub overall. SyncHub parses payload routing safely.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
      const webhookSecret =
        process.env.GITHUB_WEBHOOK_SECRET ||
        process.env.GITHUB_CLIENT_SECRET ||
        'synchub-secret-local'
      const webhookUrl = `${appUrl}/api/webhooks/github`

      try {
        await githubWebhookService.provisionRepositoryWebhook({
          userId: user.id,
          owner: validatedRepository.owner,
          repo: validatedRepository.repo,
          webhookUrl,
          secret: webhookSecret,
        })
      } catch (err) {
        console.warn('Silent GitHub API constraint overriding webhook setup', err)
        // If they lack permissions on the repo (e.g. they don't have Admin rights), GitHub rejects custom webhooks.
        // We catch this gracefully so the internal SyncHub logic preserves their preferences anyway. 
      }
    }

    return NextResponse.json({ success: true, message: 'Notifications configured' })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to configure notifications' },
      { status: 400 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')
  const providerParam = searchParams.get('provider') as AccountProvider | null

  try {
    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, {
        owner,
        repo,
      })

    const trackedRepo = await prisma.trackedRepo.findUnique({
      where: {
        userId_fullName: {
          userId: user.id,
          fullName: `${validatedRepository.owner}/${validatedRepository.repo}`,
        },
      },
      include: {
        notificationRules: true,
      },
    })

    if (!trackedRepo) {
      return NextResponse.json(
        { error: 'Repository is not currently tracked' },
        { status: 400 }
      )
    }

    const rules = trackedRepo.notificationRules.filter(
      (rule) => !providerParam || rule.provider === providerParam
    )

    const discordLinkedAccount = await prisma.linkedAccount.findFirst({
      where: {
        userId: user.id,
        provider: AccountProvider.DISCORD,
      },
    })
    const discordMetadata =
      discordLinkedAccount?.metadata &&
      typeof discordLinkedAccount.metadata === 'object'
        ? (discordLinkedAccount.metadata as Record<string, unknown>)
        : null
    const discordGuildId =
      typeof discordMetadata?.guildId === 'string' ? discordMetadata.guildId : null
    const discordChannels =
      discordGuildId && process.env.DISCORD_BOT_TOKEN
        ? await listDiscordGuildTextChannels(discordGuildId).catch(() => [])
        : []

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const webhookUrl = appUrl ? `${appUrl}/api/webhooks/github` : null
    const webhookStatus =
      webhookUrl
        ? await githubWebhookService
            .getRepositoryWebhookStatus({
              userId: user.id,
              owner: validatedRepository.owner,
              repo: validatedRepository.repo,
              webhookUrl,
            })
            .catch(() => null)
        : null

    return NextResponse.json({
      rules,
      webhookStatus,
      supportedEvents: [...SUPPORTED_GITHUB_WEBHOOK_EVENTS],
      discordChannels,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to list rules'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
