import { CheckCircle2, Settings2, TriangleAlert } from 'lucide-react'
import Link from 'next/link'

import { SectionHeader } from '@/components/dashboard/section-header'
import { DailySummarySettingsForm } from '@/components/dashboard/settings/daily-summary-settings-form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk'
import { getDiscordCommands } from '@/lib/discord/api'
import prisma from '@/lib/prisma'
import { getTelegramWebhookInfo } from '@/lib/telegram/api'
import { getTelegramWebhookUrl } from '@/lib/telegram/linking'

function EndpointStatusBadge({
  healthy,
  label,
}: {
  healthy: boolean
  label: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
        healthy
          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100'
          : 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-100'
      }`}
    >
      {healthy ? (
        <CheckCircle2 className="size-3.5" />
      ) : (
        <TriangleAlert className="size-3.5" />
      )}
      {label}
    </span>
  )
}

export default async function SettingsPage() {
  const currentUser = await getOrCreateCurrentUserRecord()

  if (!currentUser) {
    return null
  }

  const [linkedAccounts, trackedRepos] = await Promise.all([
    prisma.linkedAccount.findMany({
      where: {
        userId: currentUser.id,
      },
    }),
    prisma.trackedRepo.findMany({
      where: {
        userId: currentUser.id,
      },
      include: {
        notificationRules: true,
      },
      orderBy: [{ isDefault: 'desc' }, { fullName: 'asc' }],
    }),
  ])

  const accountsByProvider = new Map(
    linkedAccounts.map((account) => [account.provider, account])
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? null
  const usesLocalhost = Boolean(appUrl?.includes('localhost'))
  const expectedTelegramWebhookUrl = appUrl ? getTelegramWebhookUrl() : null
  const expectedDiscordInteractionsUrl = appUrl
    ? `${appUrl.replace(/\/$/, '')}/api/discord/interactions`
    : null
  const expectedGithubWebhookUrl = appUrl
    ? `${appUrl.replace(/\/$/, '')}/api/webhooks/github`
    : null

  const telegramWebhookInfo = process.env.TELEGRAM_BOT_TOKEN
    ? await getTelegramWebhookInfo().catch(() => null)
    : null
  const telegramWebhookRegistered =
    Boolean(telegramWebhookInfo?.result.url) &&
    Boolean(expectedTelegramWebhookUrl) &&
    telegramWebhookInfo?.result.url === expectedTelegramWebhookUrl

  const discordCommands = process.env.DISCORD_BOT_TOKEN
    ? await getDiscordCommands().catch(() => null)
    : null
  const discordCommandsRegistered =
    Boolean(discordCommands?.length) &&
    ['link', 'whoami', 'status'].every((commandName) =>
      discordCommands?.some((command) => command.name === commandName)
    )

  const reposWithRules = trackedRepos.filter(
    (repo) => repo.notificationRules.length > 0
  )
  const githubLinked = Boolean(accountsByProvider.get('GITHUB')?.accessToken)
  const telegramLinked = Boolean(accountsByProvider.get('TELEGRAM'))
  const discordLinked = Boolean(accountsByProvider.get('DISCORD'))

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Manage delivery health, channel readiness, and repository coverage from one calm control surface."
        actions={
          <>
            <Button asChild>
              <Link href="/integrations">Manage integrations</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/repos">Review repositories</Link>
            </Button>
          </>
        }
      />

      {!appUrl || usesLocalhost ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
          {appUrl
            ? 'Your current app URL is localhost, so Telegram, Discord, and GitHub cannot reach your webhook routes from outside your machine. Switch NEXT_PUBLIC_APP_URL to a public HTTPS URL such as your current ngrok tunnel.'
            : 'NEXT_PUBLIC_APP_URL is not configured yet. Set it to a public HTTPS URL so providers can deliver webhook and interaction traffic to SyncHub.'}
        </div>
      ) : null}

      <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Integration health</CardTitle>
            <CardDescription>
              Confirm each service is connected before you depend on routing and
              automation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                title: 'GitHub',
                healthy: githubLinked,
                detail: githubLinked
                  ? 'GitHub API access is connected for issue actions and webhook provisioning.'
                  : 'Authorize GitHub first so SyncHub can talk to repository APIs.',
              },
              {
                title: 'Telegram',
                healthy: telegramLinked,
                detail: telegramLinked
                  ? 'Telegram account is linked and ready to receive routed alerts.'
                  : 'Link Telegram before enabling repository notifications there.',
              },
              {
                title: 'Discord',
                healthy: discordLinked,
                detail: discordLinked
                  ? 'Discord account is linked and can receive routed alerts once channel delivery is configured.'
                  : 'Link Discord before enabling repository notifications there.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200/70 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{item.title}</p>
                  <EndpointStatusBadge
                    healthy={item.healthy}
                    label={item.healthy ? 'Connected' : 'Needs setup'}
                  />
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  {item.detail}
                </p>
              </div>
            ))}

            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="font-medium">If your public URL changes</p>
              <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                <li>1. Update `NEXT_PUBLIC_APP_URL` and restart the app.</li>
                <li>2. Refresh the Telegram webhook.</li>
                <li>
                  3. Update the Discord interactions endpoint in the developer
                  portal.
                </li>
                <li>
                  4. Re-save repo notification rules so GitHub re-provisions the
                  webhook with the new URL.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="text-foreground size-5" />
            Daily summary preferences
          </CardTitle>
          <CardDescription>
            Choose where the daily briefing should land and use the controls
            here for manual checks when needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {discordLinked ? (
            <div className="max-w-2xl">
              <DailySummarySettingsForm
                initialChannelId={
                  (
                    accountsByProvider.get('DISCORD')?.metadata as Record<
                      string,
                      unknown
                    >
                  )?.dailySummaryChannelId as string
                }
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Link a Discord account to configure specific delivery channels for
              your daily summaries.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
