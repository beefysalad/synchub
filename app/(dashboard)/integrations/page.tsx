import { Bot, CheckCircle2, Github, MessageSquareCode } from 'lucide-react'

import { getOrCreateCurrentUserRecord } from '@/lib/clerk'
import { getDiscordCommands } from '@/lib/discord/api'
import prisma from '@/lib/prisma'
import { getTelegramWebhookInfo } from '@/lib/telegram/api'
import { getTelegramWebhookUrl } from '@/lib/telegram/linking'
import { IntegrationActionLink } from '@/components/dashboard/integration-action-link'
import { SectionHeader } from '@/components/dashboard/section-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const integrationCards = [
  {
    key: 'GITHUB',
    title: 'GitHub',
    description:
      'Manage issues, comments, and assignments without leaving SyncHub.',
    defaultCtaLabel: 'Authorize GitHub access',
    href: '/api/integrations/github/start',
    icon: Github,
  },
  {
    key: 'TELEGRAM',
    title: 'Telegram',
    description:
      'Get alerts, reminders, and quick commands right inside Telegram.',
    defaultCtaLabel: 'Connect Telegram',
    href: '/api/integrations/telegram/start',
    icon: Bot,
  },
  {
    key: 'DISCORD',
    title: 'Discord',
    description:
      'Let your team run SyncHub commands from the Discord server you already use.',
    defaultCtaLabel: 'Start Discord link',
    href: '/api/integrations/discord/start',
    icon: MessageSquareCode,
  },
] as const

type IntegrationsPageProps = {
  searchParams?: Promise<{
    github?: string
    telegramWebhook?: string
    discordCommands?: string
    discordCode?: string
    discordExpiresAt?: string
    discordInstructions?: string
    reason?: string
  }>
}

export default async function IntegrationsPage({
  searchParams,
}: IntegrationsPageProps) {
  const currentUser = await getOrCreateCurrentUserRecord()
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  const linkedAccounts = currentUser
    ? await prisma.linkedAccount.findMany({
        where: {
          userId: currentUser.id,
        },
      })
    : []

  const accountsByProvider = new Map(
    linkedAccounts.map((account) => [account.provider, account])
  )
  const expectedTelegramWebhookUrl = process.env.NEXT_PUBLIC_APP_URL
    ? getTelegramWebhookUrl()
    : null
  const telegramWebhookInfo = process.env.TELEGRAM_BOT_TOKEN
    ? await getTelegramWebhookInfo().catch(() => null)
    : null
  const telegramWebhookRegistered =
    telegramWebhookInfo?.result.url &&
    expectedTelegramWebhookUrl &&
    telegramWebhookInfo.result.url === expectedTelegramWebhookUrl
  const discordCommands = process.env.DISCORD_BOT_TOKEN
    ? await getDiscordCommands().catch(() => null)
    : null
  const discordCommandsRegistered =
    Boolean(discordCommands?.length) &&
    ['link', 'whoami', 'status'].every((commandName) =>
      discordCommands?.some((command) => command.name === commandName)
    )

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Integrations"
        title="Connect the tools your team already uses"
        description="Clerk handles app authentication, while each integration flow grants the platform-specific access SyncHub needs to do real work."
      />

      {resolvedSearchParams?.github === 'connected' ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
          GitHub authorization completed. SyncHub can now use your dedicated
          GitHub access token for issue actions.
        </div>
      ) : null}

      {resolvedSearchParams?.telegramWebhook === 'registered' ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
          Telegram webhook registered successfully. Telegram can now deliver bot
          updates to SyncHub.
        </div>
      ) : null}

      {resolvedSearchParams?.telegramWebhook === 'error' ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
          Telegram webhook registration failed.
          {resolvedSearchParams.reason ? ` ${resolvedSearchParams.reason}` : ''}
        </div>
      ) : null}

      {resolvedSearchParams?.discordCommands === 'registered' ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
          Discord slash commands registered successfully. Your server should now
          expose `/link`, `/whoami`, and `/status`.
        </div>
      ) : null}

      {resolvedSearchParams?.discordCommands === 'error' ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
          Discord command registration failed.
          {resolvedSearchParams.reason ? ` ${resolvedSearchParams.reason}` : ''}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {integrationCards.map(
          ({
            key,
            title,
            description,
            defaultCtaLabel,
            href,
            icon: Icon,
          }) => {
            const account = accountsByProvider.get(key)
            const isGitHubAuthorized =
              key === 'GITHUB' && Boolean(account?.accessToken)
            const isConnected =
              key === 'GITHUB' ? isGitHubAuthorized : Boolean(account)
            const metadata =
              account?.metadata && typeof account.metadata === 'object'
                ? (account.metadata as Record<string, unknown>)
                : null
            const scopes = Array.isArray(metadata?.scopes)
              ? metadata?.scopes.filter(
                  (scope): scope is string => typeof scope === 'string'
                )
              : []
            const showTelegramWebhookStatus = key === 'TELEGRAM'
            const showDiscordStatus = key === 'DISCORD'
            return (
              <Card
                key={title}
                className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <Icon className="size-5" />
                    </div>
                    {isConnected ? (
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                        <CheckCircle2 className="size-3.5" />
                        Connected
                      </div>
                    ) : null}
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {isConnected ? (
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                      <p className="font-medium text-foreground">
                        {account?.username
                          ? `Connected as ${account.username}`
                          : `${title} is connected`}
                      </p>
                      {key === 'GITHUB' && scopes.length > 0 ? (
                        <p className="mt-2 text-xs">
                          Granted scopes: {scopes.join(', ')}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {showTelegramWebhookStatus ? (
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                      <p className="font-medium text-foreground">
                        Webhook:{' '}
                        {telegramWebhookRegistered ? 'registered' : 'not registered'}
                      </p>
                      <p className="mt-2 text-xs">
                        Expected URL:{' '}
                        {expectedTelegramWebhookUrl ?? 'Set NEXT_PUBLIC_APP_URL first'}
                      </p>
                      {telegramWebhookInfo?.result.url ? (
                        <p className="mt-1 text-xs">
                          Current URL: {telegramWebhookInfo.result.url}
                        </p>
                      ) : null}
                      {telegramWebhookInfo?.result.last_error_message ? (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                          Last Telegram error: {telegramWebhookInfo.result.last_error_message}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {showDiscordStatus ? (
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                      <p className="font-medium text-foreground">
                        Slash commands:{' '}
                        {discordCommandsRegistered ? 'registered' : 'not registered'}
                      </p>
                      {discordCommands?.length ? (
                        <p className="mt-2 text-xs">
                          Available commands: {discordCommands.map((command) => `/${command.name}`).join(', ')}
                        </p>
                      ) : null}
                      {resolvedSearchParams?.discordCode ? (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-950">
                          <p className="font-medium text-foreground">
                            Your current link code: {resolvedSearchParams.discordCode}
                          </p>
                          {resolvedSearchParams.discordInstructions ? (
                            <p className="mt-1 text-xs">
                              {resolvedSearchParams.discordInstructions}
                            </p>
                          ) : null}
                          {resolvedSearchParams.discordExpiresAt ? (
                            <p className="mt-1 text-xs">
                              Expires at: {new Date(resolvedSearchParams.discordExpiresAt).toLocaleString()}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
                <CardFooter>
                  {key === 'TELEGRAM' ? (
                    <div className="flex w-full flex-col gap-3">
                      <IntegrationActionLink
                        href={href}
                        label={isConnected ? 'Reconnect Telegram' : defaultCtaLabel}
                        loadingLabel={
                          isConnected ? 'Reconnecting Telegram...' : 'Connecting Telegram...'
                        }
                        className="w-full rounded-full"
                      />
                      <IntegrationActionLink
                        href="/api/integrations/telegram/webhook/register"
                        label={
                          telegramWebhookRegistered
                            ? 'Refresh Telegram webhook'
                            : 'Register Telegram webhook'
                        }
                        loadingLabel="Registering Telegram webhook..."
                        variant="outline"
                        className="w-full rounded-full"
                      />
                    </div>
                  ) : key === 'DISCORD' ? (
                    <div className="flex w-full flex-col gap-3">
                      <IntegrationActionLink
                        href={href}
                        label={isConnected ? 'Reconnect Discord' : defaultCtaLabel}
                        loadingLabel={
                          isConnected ? 'Reconnecting Discord...' : 'Starting Discord link...'
                        }
                        className="w-full rounded-full"
                      />
                      <IntegrationActionLink
                        href="/api/integrations/discord/commands/register"
                        label={
                          discordCommandsRegistered
                            ? 'Refresh Discord commands'
                            : 'Register Discord commands'
                        }
                        loadingLabel="Registering Discord commands..."
                        variant="outline"
                        className="w-full rounded-full"
                      />
                    </div>
                  ) : isConnected ? (
                    <Button
                      disabled
                      className="w-full rounded-full bg-emerald-600 text-white opacity-100 hover:bg-emerald-600"
                    >
                      {key === 'GITHUB' ? 'GitHub Authorized' : `${title} Connected`}
                    </Button>
                  ) : (
                    <IntegrationActionLink
                      href={href}
                      label={defaultCtaLabel}
                      loadingLabel="Redirecting..."
                      className="w-full rounded-full"
                    />
                  )}
                </CardFooter>
              </Card>
            )
          }
        )}
      </div>
    </div>
  )
}
