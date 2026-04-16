import { CheckCircle2, ExternalLink, Github, MessageSquareCode, Settings2, TriangleAlert, Webhook } from 'lucide-react'
import Link from 'next/link'

import { getOrCreateCurrentUserRecord } from '@/lib/clerk'
import { getDiscordCommands } from '@/lib/discord/api'
import prisma from '@/lib/prisma'
import { getTelegramWebhookInfo } from '@/lib/telegram/api'
import { getTelegramWebhookUrl } from '@/lib/telegram/linking'
import { IntegrationActionLink } from '@/components/dashboard/integration-action-link'
import { SectionHeader } from '@/components/dashboard/section-header'
import { StatusCard } from '@/components/dashboard/status-card'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DailySummarySettingsForm } from '@/components/dashboard/settings/daily-summary-settings-form'

const notificationEventLabels: Record<string, string> = {
  issues: 'New issues',
  pull_request: 'New pull requests',
  push: 'Pushes',
  issue_comment: 'Issue comments',
}

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
      {healthy ? <CheckCircle2 className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
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
        title="Operational settings"
        description="Review your public endpoints, integration health, and repository notification coverage in one place."
        actions={
          <>
            <Button asChild className="rounded-full">
              <Link href="/integrations">Manage integrations</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/issues">Review tracked repos</Link>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={Webhook}
          label="Public App URL"
          value={appUrl ? 'Configured' : 'Missing'}
          detail={appUrl ?? 'Set NEXT_PUBLIC_APP_URL to a public HTTPS URL.'}
        />
        <StatusCard
          icon={Github}
          label="Tracked repos"
          value={String(trackedRepos.length)}
          detail={`${reposWithRules.length} repositories currently have live notification rules.`}
        />
        <StatusCard
          icon={MessageSquareCode}
          label="Linked channels"
          value={String([githubLinked, telegramLinked, discordLinked].filter(Boolean).length)}
          detail={`GitHub ${githubLinked ? 'connected' : 'missing'}, Telegram ${telegramLinked ? 'connected' : 'missing'}, Discord ${discordLinked ? 'connected' : 'missing'}.`}
        />
        <StatusCard
          icon={Settings2}
          label="Discord commands"
          value={discordCommandsRegistered ? 'Ready' : 'Needs setup'}
          detail={
            discordCommandsRegistered
              ? `Registered: ${discordCommands?.map((command) => `/${command.name}`).join(', ')}`
              : 'Register slash commands again if your Discord setup was reset.'
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle>Webhook endpoints</CardTitle>
            <CardDescription>
              These are the public endpoints your providers need to reach. When
              your ngrok URL changes, this is the first place to sanity check.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">GitHub repository events</p>
                    <EndpointStatusBadge
                      healthy={Boolean(expectedGithubWebhookUrl)}
                      label={expectedGithubWebhookUrl ? 'Ready to provision' : 'Missing app URL'}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Auto-provisioned when you enable notifications for a tracked repository.
                  </p>
                  <p className="break-all text-xs text-muted-foreground">
                    {expectedGithubWebhookUrl ?? 'Set NEXT_PUBLIC_APP_URL first'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Telegram webhook</p>
                    <EndpointStatusBadge
                      healthy={telegramWebhookRegistered}
                      label={telegramWebhookRegistered ? 'Registered' : 'Needs refresh'}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Telegram should post bot updates here after you refresh the webhook.
                  </p>
                  <p className="break-all text-xs text-muted-foreground">
                    Expected: {expectedTelegramWebhookUrl ?? 'Set NEXT_PUBLIC_APP_URL first'}
                  </p>
                  {telegramWebhookInfo?.result.url ? (
                    <p className="break-all text-xs text-muted-foreground">
                      Current: {telegramWebhookInfo.result.url}
                    </p>
                  ) : null}
                  {telegramWebhookInfo?.result.last_error_message ? (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Last Telegram error: {telegramWebhookInfo.result.last_error_message}
                    </p>
                  ) : null}
                </div>
                <IntegrationActionLink
                  href="/api/integrations/telegram/webhook/register"
                  label={telegramWebhookRegistered ? 'Refresh Telegram webhook' : 'Register Telegram webhook'}
                  loadingLabel="Registering Telegram webhook..."
                  variant="outline"
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Discord interactions</p>
                    <EndpointStatusBadge
                      healthy={discordCommandsRegistered}
                      label={discordCommandsRegistered ? 'Commands live' : 'Check portal'}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Paste this into the Discord Developer Portal as the interactions endpoint URL.
                  </p>
                  <p className="break-all text-xs text-muted-foreground">
                    {expectedDiscordInteractionsUrl ?? 'Set NEXT_PUBLIC_APP_URL first'}
                  </p>
                </div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/integrations">Manage Discord setup</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle>Integration health</CardTitle>
            <CardDescription>
              Keep the channel links and app secrets in sync before you expect notifications to fan out reliably.
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
                <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}

            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="font-medium">If your ngrok URL changes</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>1. Update `NEXT_PUBLIC_APP_URL` and restart the app.</li>
                <li>2. Refresh the Telegram webhook.</li>
                <li>3. Update the Discord interactions endpoint in the developer portal.</li>
                <li>4. Re-save repo notification rules so GitHub re-provisions the webhook with the new URL.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-indigo-200/50 bg-indigo-50/20 shadow-lg shadow-indigo-100/20 backdrop-blur dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="size-5 text-indigo-500" />
            Daily Summary Preferences
          </CardTitle>
          <CardDescription>
            Configure where daily recaps are delivered, then use the manual controls here for testing while cron-job.org handles scheduled generation.
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
            <p className="text-sm text-muted-foreground">
              Link a Discord account to configure specific delivery channels for your daily summaries.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <CardTitle>Repository notification coverage</CardTitle>
          <CardDescription>
            Each tracked repository can forward GitHub activity to Telegram or Discord. Open repo settings to manage exactly which events are sent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trackedRepos.length ? (
            trackedRepos.map((repo) => {
              const [owner, repoName] = repo.fullName.split('/')
              const telegramRule = repo.notificationRules.find(
                (rule) => rule.provider === 'TELEGRAM'
              )
              const discordRule = repo.notificationRules.find(
                (rule) => rule.provider === 'DISCORD'
              )

              return (
                <div
                  key={repo.id}
                  className="rounded-3xl border border-slate-200/70 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">{repo.fullName}</p>
                        {repo.isDefault ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100">
                            Default
                          </span>
                        ) : null}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                          <p className="font-medium">Telegram delivery</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {telegramRule?.events.length
                              ? telegramRule.events
                                  .map((event) => notificationEventLabels[event] ?? event)
                                  .join(', ')
                              : 'No Telegram events enabled yet.'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                          <p className="font-medium">Discord delivery</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {discordRule?.events.length
                              ? discordRule.events
                                  .map((event) => notificationEventLabels[event] ?? event)
                                  .join(', ')
                              : 'No Discord events enabled yet.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" className="rounded-full">
                        <Link href={`/repos/${owner}/${repoName}/settings`}>
                          <Settings2 className="size-4" />
                          Repo settings
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="rounded-full">
                        <Link href={`/issues/${owner}/${repoName}`}>
                          View issues
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="rounded-full">
                        <Link
                          href={`https://github.com/${repo.fullName}/settings/hooks`}
                          target="_blank"
                        >
                          <ExternalLink className="size-4" />
                          GitHub hooks
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm text-muted-foreground dark:border-slate-700">
              You are not tracking any repositories yet. Add one from the issues page before configuring notification routing.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
