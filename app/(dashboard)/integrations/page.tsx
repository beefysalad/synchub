import { Bot, CheckCircle2, Github, MessageSquareCode } from 'lucide-react'

import { getOrCreateCurrentUserRecord } from '@/lib/clerk'
import prisma from '@/lib/prisma'
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
      'Clerk handles GitHub sign-in for app identity, while this separate OAuth flow grants SyncHub repository permissions for issue actions.',
    defaultCtaLabel: 'Authorize GitHub access',
    href: '/api/integrations/github/start',
    icon: Github,
  },
  {
    key: 'TELEGRAM',
    title: 'Telegram',
    description:
      'Connecting Telegram creates a single-use `PendingLink` token and redirects the user to the bot using a Telegram deep link.',
    defaultCtaLabel: 'Connect Telegram',
    href: '/api/integrations/telegram/start',
    icon: Bot,
  },
  {
    key: 'DISCORD',
    title: 'Discord',
    description:
      'Connecting Discord returns a one-time code for the `/link <CODE>` slash command flow used by the MVP integration.',
    defaultCtaLabel: 'Start Discord link',
    href: '/api/integrations/discord/start',
    icon: MessageSquareCode,
  },
] as const

type IntegrationsPageProps = {
  searchParams?: Promise<{
    github?: string
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

      <div className="grid gap-6 lg:grid-cols-3">
        {integrationCards.map(
          ({ key, title, description, defaultCtaLabel, href, icon: Icon }) => {
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
                  <p>
                    Each flow stores the external identity in `LinkedAccount`,
                    keeping platform-specific details out of the main `User`
                    table.
                  </p>

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
                </CardContent>
                <CardFooter>
                  {isConnected ? (
                    <Button
                      disabled
                      className="w-full rounded-full bg-emerald-600 text-white opacity-100 hover:bg-emerald-600"
                    >
                      {key === 'GITHUB' ? 'GitHub Authorized' : `${title} Connected`}
                    </Button>
                  ) : (
                    <Button asChild className="w-full rounded-full">
                      <a href={href}>{defaultCtaLabel}</a>
                    </Button>
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
