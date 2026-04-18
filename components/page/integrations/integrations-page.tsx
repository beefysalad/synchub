import { getOrCreateCurrentUserRecord } from '@/lib/clerk'
import { getDiscordCommands } from '@/lib/discord/api'
import prisma from '@/lib/prisma'
import { getTelegramWebhookInfo } from '@/lib/telegram/api'
import { getTelegramWebhookUrl } from '@/lib/telegram/linking'
import {
  getConnectedIntegrationCount,
  IntegrationCards,
} from '@/components/page/integrations/components/integration-cards'
import { SectionHeader } from '@/components/shared/section-header'

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
  const requiredDiscordCommands = ['link', 'whoami', 'status', 'issues', 'pulls']
  const discordCommandsRegistered =
    Boolean(discordCommands?.length) &&
    requiredDiscordCommands.every((commandName) =>
      discordCommands?.some((command) => command.name === commandName)
    )
  const connectedCount = getConnectedIntegrationCount(accountsByProvider)

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
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-600 transition-all duration-300 dark:text-amber-400">
          Telegram webhook registration failed.
          {resolvedSearchParams.reason ? ` ${resolvedSearchParams.reason}` : ''}
        </div>
      ) : null}

      {resolvedSearchParams?.discordCommands === 'registered' ? (
        <div className="border-primary/20 bg-primary/10 text-primary rounded-2xl border px-5 py-4 text-sm transition-all duration-300">
          Discord slash commands registered successfully. Your server should now
          expose `/link`, `/whoami`, `/status`, `/issues`, and `/pulls`.
        </div>
      ) : null}

      {resolvedSearchParams?.discordCommands === 'error' ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-600 transition-all duration-300 dark:text-amber-400">
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
            Webhook delivery{' '}
            {telegramWebhookRegistered
              ? 'is healthy'
              : 'still needs registration'}
            .
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
            Slash commands{' '}
            {discordCommandsRegistered
              ? 'are available to your server'
              : 'still need to be registered'}
            .
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <IntegrationCards
          accountsByProvider={accountsByProvider}
          expectedTelegramWebhookUrl={expectedTelegramWebhookUrl}
          telegramWebhookInfo={telegramWebhookInfo}
          telegramWebhookRegistered={Boolean(telegramWebhookRegistered)}
          discordCommands={discordCommands}
          discordCommandsRegistered={discordCommandsRegistered}
          resolvedSearchParams={resolvedSearchParams}
        />
      </div>
    </div>
  )
}
