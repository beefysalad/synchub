import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'

import { IntegrationActionLink } from '@/components/page/integrations/components/integration-action-link'
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

type LinkedAccountLike = {
  provider: string
  username: string | null
  accessToken?: string | null
  metadata?: unknown
}

type DiscordCommandLike = {
  name: string
}

type IntegrationCardsProps = {
  accountsByProvider: Map<string, LinkedAccountLike>
  expectedTelegramWebhookUrl: string | null
  telegramWebhookInfo:
    | {
        result: {
          url?: string
          last_error_message?: string
        }
      }
    | null
  telegramWebhookRegistered: boolean
  discordCommands: DiscordCommandLike[] | null
  discordCommandsRegistered: boolean
  resolvedSearchParams?: {
    discordCode?: string
    discordExpiresAt?: string
    discordInstructions?: string
  }
}

export function getConnectedIntegrationCount(
  accountsByProvider: Map<string, LinkedAccountLike>
) {
  return integrationCards.filter(({ key }) => {
    const account = accountsByProvider.get(key)

    return key === 'GITHUB' ? Boolean(account?.accessToken) : Boolean(account)
  }).length
}

export function IntegrationCards({
  accountsByProvider,
  expectedTelegramWebhookUrl,
  telegramWebhookInfo,
  telegramWebhookRegistered,
  discordCommands,
  discordCommandsRegistered,
  resolvedSearchParams,
}: IntegrationCardsProps) {
  return (
    <>
      {integrationCards.map(
        ({ key, title, description, defaultCtaLabel, href, icon }) => {
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
            ? metadata.scopes.filter(
                (scope): scope is string => typeof scope === 'string'
              )
            : []
          const showTelegramWebhookStatus = key === 'TELEGRAM'
          const showDiscordStatus = key === 'DISCORD'
          const telegramStatusItems = [
            {
              label: 'Webhook',
              value: telegramWebhookRegistered
                ? 'Registered'
                : 'Not registered',
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
              value: discordCommandsRegistered
                ? 'Registered'
                : 'Not registered',
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
            <Card key={title} className="h-full overflow-hidden">
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
              <CardContent className="text-muted-foreground space-y-4 px-6 pt-6 text-sm">
                {isConnected ? (
                  <div className="glass-surface rounded-2xl px-4 py-3 transition-all duration-300">
                    <p className="text-muted-foreground text-[11px] font-bold tracking-[0.18em] uppercase">
                      Linked account
                    </p>
                    <p className="text-foreground mt-2 font-medium">
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
                            className={`text-sm leading-relaxed break-all ${
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
                        <p className="text-foreground mt-2 font-medium">
                          Your current link code:{' '}
                          {resolvedSearchParams.discordCode}
                        </p>
                        {resolvedSearchParams.discordInstructions ? (
                          <p className="mt-1 text-xs leading-relaxed">
                            {resolvedSearchParams.discordInstructions}
                          </p>
                        ) : null}
                        {resolvedSearchParams.discordExpiresAt ? (
                          <p className="mt-1 text-xs">
                            Expires at:{' '}
                            {new Date(
                              resolvedSearchParams.discordExpiresAt
                            ).toLocaleString()}
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
                      label={
                        isConnected ? 'Reconnect Telegram' : defaultCtaLabel
                      }
                      loadingLabel={
                        isConnected
                          ? 'Reconnecting Telegram...'
                          : 'Connecting Telegram...'
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
                      label={
                        isConnected ? 'Reconnect Discord' : defaultCtaLabel
                      }
                      loadingLabel={
                        isConnected
                          ? 'Reconnecting Discord...'
                          : 'Starting Discord link...'
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
                    {key === 'GITHUB'
                      ? 'GitHub Authorized'
                      : `${title} Connected`}
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
    </>
  )
}
