import {
  BellRing,
  CheckCircle2,
  Github,
  MessageSquareMore,
  Settings2,
  TriangleAlert,
} from 'lucide-react'
import Link from 'next/link'

import { DailySummarySettingsForm } from '@/components/page/settings/components/daily-summary-settings-form'
import { SectionHeader } from '@/components/shared/section-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getOrCreateCurrentUserRecord } from '@/lib/clerk'
import prisma from '@/lib/prisma'

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

function HealthMiniCard({
  icon: Icon,
  label,
  state,
  detail,
}: {
  icon: typeof Github
  label: string
  state: string
  detail: string
}) {
  return (
    <div className="glass-surface rounded-3xl px-5 py-5 transition-all duration-300">
      <div className="space-y-3">
        <div className="glass-surface flex size-11 items-center justify-center rounded-2xl shadow-sm transition-all duration-300">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
            {label}
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight">{state}</p>
        </div>
      </div>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        {detail}
      </p>
    </div>
  )
}

export default async function SettingsPage() {
  const currentUser = await getOrCreateCurrentUserRecord()

  if (!currentUser) {
    return null
  }

  const linkedAccounts = await prisma.linkedAccount.findMany({
    where: {
      userId: currentUser.id,
    },
  })

  const accountsByProvider = new Map(
    linkedAccounts.map((account) => [account.provider, account])
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? null
  const usesLocalhost = Boolean(appUrl?.includes('localhost'))
  const githubLinked = Boolean(accountsByProvider.get('GITHUB')?.accessToken)
  const telegramLinked = Boolean(accountsByProvider.get('TELEGRAM'))
  const discordLinked = Boolean(accountsByProvider.get('DISCORD'))

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Manage delivery health, summary routing, and environment readiness from one calmer control surface."
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

      <div className="grid gap-4 lg:grid-cols-3">
        <HealthMiniCard
          icon={Github}
          label="GitHub"
          state={githubLinked ? 'Connected' : 'Needs setup'}
          detail={
            githubLinked
              ? 'Repository actions and issue workflows are ready to go.'
              : 'Authorize GitHub so SyncHub can work with repository APIs.'
          }
        />
        <HealthMiniCard
          icon={BellRing}
          label="Telegram"
          state={telegramLinked ? 'Connected' : 'Needs setup'}
          detail={
            telegramLinked
              ? 'Telegram delivery is available for reminders and summaries.'
              : 'Link Telegram before sending reminders or summaries there.'
          }
        />
        <HealthMiniCard
          icon={MessageSquareMore}
          label="Discord"
          state={discordLinked ? 'Connected' : 'Needs setup'}
          detail={
            discordLinked
              ? 'Discord can receive routed updates once channels are configured.'
              : 'Link Discord to manage channel-based delivery.'
          }
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
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
            <DailySummarySettingsForm
              initialChannelId={
                (
                  accountsByProvider.get('DISCORD')?.metadata as Record<
                    string,
                    unknown
                  >
                )?.dailySummaryChannelId as string
              }
              initialReminderChannelId={
                (
                  accountsByProvider.get('DISCORD')?.metadata as Record<
                    string,
                    unknown
                  >
                )?.reminderChannelId as string
              }
              initialAiModel={
                currentUser.aiModel === 'gemini-2.5-flash'
                  ? 'gemini-2.5-flash'
                  : 'gemini-2.5-flash-lite'
              }
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Integration health</CardTitle>
              <CardDescription>
                Confirm each service is connected before you depend on routing
                and automation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
                  className="glass-surface rounded-2xl px-4 py-4 transition-all duration-300"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.title}</p>
                    <EndpointStatusBadge
                      healthy={item.healthy}
                      label={item.healthy ? 'Connected' : 'Needs setup'}
                    />
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Public URL checklist</CardTitle>
              <CardDescription>
                If your tunnel or public URL changes, refresh these delivery
                paths in order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                'Update `NEXT_PUBLIC_APP_URL` and restart the app.',
                'Refresh the Telegram webhook.',
                'Update the Discord interactions endpoint in the developer portal.',
                'Re-save repo notification rules so GitHub re-provisions the webhook with the new URL.',
              ].map((step) => (
                <div
                  key={step}
                  className="glass-surface rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all duration-300"
                >
                  {step}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
