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
            return (
              <Card
                key={title}
                className="h-full"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="glass-surface flex size-12 items-center justify-center rounded-2xl shadow-sm transition-all duration-300">
                      <Image
                        src={icon}
                        alt={`${title} logo`}
                        width={24}
                        height={24}
                        className="size-6"
                      />
                    </div>
                    {isConnected ? (
                      <div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-all duration-300">
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
                    <div className="glass-surface rounded-2xl px-4 py-3 transition-all duration-300">
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
                    <div className="glass-surface rounded-2xl px-4 py-3 transition-all duration-300">
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
                    <div className="glass-surface rounded-2xl px-4 py-3 transition-all duration-300">
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
                        <div className="glass-panel border-border/50 mt-3 rounded-xl px-3 py-3 shadow-sm transition-all duration-300">
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
                        className="w-full"
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
                        className="w-full"
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
                        className="w-full"
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
                        className="w-full"
                      />
                    </div>
                  ) : isConnected ? (
                    <Button
                      disabled
                      className="w-full opacity-100"
                    >
                      {key === 'GITHUB' ? 'GitHub Authorized' : `${title} Connected`}
                    </Button>
                  ) : (
                    <IntegrationActionLink
                      href={href}
                      label={defaultCtaLabel}
                      loadingLabel="Redirecting..."
                      className="w-full"
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
