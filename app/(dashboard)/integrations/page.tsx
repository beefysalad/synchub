import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'

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
    icon: '/Github Icon.svg',
  },
  {
    key: 'TELEGRAM',
    title: 'Telegram',
    description:
      'Get alerts, reminders, and quick commands right inside Telegram.',
    defaultCtaLabel: 'Connect Telegram',
    href: '/api/integrations/telegram/start',
    icon: '/Telegram SVG Icon.svg',
  },
  {
    key: 'DISCORD',
    title: 'Discord',
    description:
      'Let your team run SyncHub commands from the Discord server you already use.',
    defaultCtaLabel: 'Start Discord link',
    href: '/api/integrations/discord/start',
    icon: '/Discord SVG Icon.svg',
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
  const connectedCount = integrationCards.filter(({ key }) => {
    const account = accountsByProvider.get(key)

    return key === 'GITHUB' ? Boolean(account?.accessToken) : Boolean(account)
  }).length

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Integrations"
        title="Connect the channels your team lives in"
        description="Keep GitHub, Telegram, and Discord ready so SyncHub can route updates, reminders, and actions without extra setup every time."
      />

      {resolvedSearchParams?.github === 'connected' ? (
        <div className="border-primary/20 bg-primary/10 text-primary rounded-2xl border px-5 py-4 text-sm transition-all duration-300">
          GitHub authorization completed. SyncHub can now use your dedicated
          GitHub access token for issue actions.
        </div>
      ) : null}

      {resolvedSearchParams?.telegramWebhook === 'registered' ? (
        <div className="border-primary/20 bg-primary/10 text-primary rounded-2xl border px-5 py-4 text-sm transition-all duration-300">
          Telegram webhook registered successfully. Telegram can now deliver bot
          updates to SyncHub.
        </div>
      ) : null}

      {resolvedSearchParams?.telegramWebhook === 'error' ? (
        <div className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border px-5 py-4 text-sm transition-all duration-300">
          Telegram webhook registration failed.
          {resolvedSearchParams.reason ? ` ${resolvedSearchParams.reason}` : ''}
        </div>
      ) : null}

      {resolvedSearchParams?.discordCommands === 'registered' ? (
        <div className="border-primary/20 bg-primary/10 text-primary rounded-2xl border px-5 py-4 text-sm transition-all duration-300">
          Discord slash commands registered successfully. Your server should now
          expose `/link`, `/whoami`, and `/status`.
        </div>
      ) : null}

      {resolvedSearchParams?.discordCommands === 'error' ? (
        <div className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border px-5 py-4 text-sm transition-all duration-300">
          Discord command registration failed.
          {resolvedSearchParams.reason ? ` ${resolvedSearchParams.reason}` : ''}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-surface rounded-3xl px-5 py-5 transition-all duration-300">
          <p className="text-muted-foreground text-xs font-bold tracking-[0.22em] uppercase">
            Coverage
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {connectedCount}/3
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Core integrations currently connected to your workspace.
          </p>
        </div>
        <div className="glass-surface rounded-3xl px-5 py-5 transition-all duration-300">
          <p className="text-muted-foreground text-xs font-bold tracking-[0.22em] uppercase">
            Telegram
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {telegramWebhookRegistered ? 'Ready' : 'Needs setup'}
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Webhook delivery {telegramWebhookRegistered ? 'is healthy' : 'still needs registration'}.
          </p>
        </div>
        <div className="glass-surface rounded-3xl px-5 py-5 transition-all duration-300">
          <p className="text-muted-foreground text-xs font-bold tracking-[0.22em] uppercase">
            Discord
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {discordCommandsRegistered ? 'Commands live' : 'Commands missing'}
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Slash commands {discordCommandsRegistered ? 'are available to your server' : 'still need to be registered'}.
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        {integrationCards.map(
          ({
            key,
            title,
            description,
            defaultCtaLabel,
            href,
            icon,
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
            const telegramStatusItems = [
              {
                label: 'Webhook',
                value: telegramWebhookRegistered ? 'Registered' : 'Not registered',
              },
              {
                label: 'Expected URL',
                value:
                  expectedTelegramWebhookUrl ?? 'Set NEXT_PUBLIC_APP_URL first',
              },
              ...(telegramWebhookInfo?.result.url
                ? [
                    {
                      label: 'Current URL',
                      value: telegramWebhookInfo.result.url,
                    },
                  ]
                : []),
              ...(telegramWebhookInfo?.result.last_error_message
                ? [
                    {
                      label: 'Last error',
                      value: telegramWebhookInfo.result.last_error_message,
                    },
                  ]
                : []),
            ]
            const discordStatusItems = [
              {
                label: 'Slash commands',
                value: discordCommandsRegistered ? 'Registered' : 'Not registered',
              },
              ...(discordCommands?.length
                ? [
                    {
                      label: 'Available',
                      value: discordCommands
                        .map((command) => `/${command.name}`)
                        .join(', '),
                    },
                  ]
                : []),
            ]
            return (
              <Card
                key={title}
                className="h-full overflow-hidden"
              >
                <CardHeader className="gap-4 px-6 pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="glass-surface flex size-13 items-center justify-center rounded-2xl shadow-sm transition-all duration-300">
                      <Image
                        src={icon}
                        alt={`${title} logo`}
                        width={24}
                        height={24}
                        className="size-6"
                      />
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${
                        isConnected
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <CheckCircle2 className="size-3.5" />
                      {isConnected ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs font-bold tracking-[0.22em] uppercase">
                      {key === 'GITHUB'
                        ? 'Source Control'
                        : key === 'TELEGRAM'
                          ? 'Notifications'
                          : 'Team Commands'}
                    </p>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                      {title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pt-6 text-sm text-muted-foreground">
                  {isConnected ? (
                    <div className="glass-surface rounded-2xl px-4 py-3 transition-all duration-300">
                      <p className="text-muted-foreground text-[11px] font-bold tracking-[0.18em] uppercase">
                        Linked account
                      </p>
                      <p className="mt-2 font-medium text-foreground">
                        {account?.username
                          ? `Connected as ${account.username}`
                          : `${title} is connected`}
                      </p>
                      {key === 'GITHUB' && scopes.length > 0 ? (
                        <p className="mt-2 text-xs leading-relaxed">
                          Granted scopes: {scopes.join(', ')}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {showTelegramWebhookStatus ? (
                    <div className="glass-surface rounded-2xl px-4 py-3 transition-all duration-300">
                      <p className="text-muted-foreground text-[11px] font-bold tracking-[0.18em] uppercase">
                        Delivery health
                      </p>
                      <div className="mt-3 space-y-3">
                        {telegramStatusItems.map((item) => (
                          <div
                            key={item.label}
                            className="border-border/60 flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0"
                          >
                            <p className="text-muted-foreground text-[11px] font-bold tracking-[0.16em] uppercase">
                              {item.label}
                            </p>
                            <p
                              className={`break-all text-sm leading-relaxed ${
                                item.label === 'Last error'
                                  ? 'text-amber-700 dark:text-amber-300'
                                  : 'text-foreground'
                              }`}
                            >
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {showDiscordStatus ? (
                    <div className="glass-surface rounded-2xl px-4 py-3 transition-all duration-300">
                      <p className="text-muted-foreground text-[11px] font-bold tracking-[0.18em] uppercase">
                        Command status
                      </p>
                      <div className="mt-3 space-y-3">
                        {discordStatusItems.map((item) => (
                          <div
                            key={item.label}
                            className="border-border/60 flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0"
                          >
                            <p className="text-muted-foreground text-[11px] font-bold tracking-[0.16em] uppercase">
                              {item.label}
                            </p>
                            <p className="text-foreground text-sm leading-relaxed">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                      {resolvedSearchParams?.discordCode ? (
                        <div className="glass-panel border-border/50 mt-4 rounded-xl px-3 py-3 shadow-sm transition-all duration-300">
                          <p className="text-muted-foreground text-[11px] font-bold tracking-[0.16em] uppercase">
                            Active link code
                          </p>
                          <p className="mt-2 font-medium text-foreground">
                            Your current link code: {resolvedSearchParams.discordCode}
                          </p>
                          {resolvedSearchParams.discordInstructions ? (
                            <p className="mt-1 text-xs leading-relaxed">
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
                <CardFooter className="mt-auto px-6 pt-6">
                  {key === 'TELEGRAM' ? (
                    <div className="grid w-full gap-3 sm:grid-cols-2">
                      <IntegrationActionLink
                        href={href}
                        label={isConnected ? 'Reconnect Telegram' : defaultCtaLabel}
                        loadingLabel={
                          isConnected ? 'Reconnecting Telegram...' : 'Connecting Telegram...'
                        }
                        className="h-11 w-full rounded-full"
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
                        className="h-11 w-full rounded-full"
                      />
                    </div>
                  ) : key === 'DISCORD' ? (
                    <div className="grid w-full gap-3 sm:grid-cols-2">
                      <IntegrationActionLink
                        href={href}
                        label={isConnected ? 'Reconnect Discord' : defaultCtaLabel}
                        loadingLabel={
                          isConnected ? 'Reconnecting Discord...' : 'Starting Discord link...'
                        }
                        className="h-11 w-full rounded-full"
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
                        className="h-11 w-full rounded-full"
                      />
                    </div>
                  ) : isConnected ? (
                    <Button
                      disabled
                      className="h-11 w-full rounded-full opacity-100"
                    >
                      {key === 'GITHUB' ? 'GitHub Authorized' : `${title} Connected`}
                    </Button>
                  ) : (
                    <IntegrationActionLink
                      href={href}
                      label={defaultCtaLabel}
                      loadingLabel="Redirecting..."
                      className="h-11 w-full rounded-full"
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
