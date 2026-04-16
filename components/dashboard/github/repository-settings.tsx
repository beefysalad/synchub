'use client'

import {
  ArrowLeft,
  BellRing,
  ExternalLink,
  Github,
  MessageCircle,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { SectionHeader } from '@/components/dashboard/section-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import {
  useGithubNotifications,
  useUpdateNotificationRule,
} from '@/hooks/use-github-notifications'
import { useGithubRepositories } from '@/hooks/use-github-repositories'

export function RepositorySettingsPage({
  owner,
  repo,
}: {
  owner: string
  repo: string
}) {
  const repositoryFullName = `${owner}/${repo}`

  const { data: repositoryData } = useGithubRepositories()
  const repository =
    repositoryData?.repositories.find(
      (candidate) => candidate.full_name === repositoryFullName
    ) ?? null

  const { data: notificationsData, isLoading: isLoadingNotifications } =
    useGithubNotifications(owner, repo)

  const updateRule = useUpdateNotificationRule(owner, repo)

  const webhookStatus = notificationsData?.webhookStatus
  const supportedEvents =
    notificationsData?.supportedEvents ?? ['issues', 'pull_request', 'push', 'issue_comment']
  const notificationEvents = supportedEvents.filter((eventType) =>
    ['issues', 'pull_request', 'push', 'issue_comment'].includes(eventType)
  )
  const discordRule =
    notificationsData?.rules.find((rule) => rule.provider === 'DISCORD') ?? null
  const discordChannels = notificationsData?.discordChannels ?? []

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Repository Workspace"
        title={`${repositoryFullName} Settings`}
        description="Configure automations and notification rules for this specific repository."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/repos/${owner}/${repo}`}>
                <ArrowLeft className="size-4" />
                Back to repo
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link
                href={repository?.html_url ?? `https://github.com/${owner}/${repo}`}
                target="_blank"
              >
                <ExternalLink className="size-4" />
                Open in GitHub
              </Link>
            </Button>
          </>
        }
      />

      <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="size-5 text-indigo-500" />
              Broadcast Notification Rules
            </CardTitle>
            <CardDescription>
              Route real-time GitHub events from this repository directly to your integrated bots. SyncHub will automatically provision webhooks on your behalf to forward live events.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {isLoadingNotifications ? (
              <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm text-muted-foreground dark:border-slate-700">
                <Spinner className="mr-2 inline size-4" /> Loading your notification rules...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50/60 px-6 py-6 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Github className="size-5 text-slate-900 dark:text-slate-100" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          GitHub webhook health
                        </h3>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        SyncHub provisions a single repository webhook and routes live GitHub events to your connected channels from there.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-300/80 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                        {webhookStatus?.exists ? 'Webhook found' : 'Webhook not found'}
                      </span>
                      <span className="rounded-full border border-slate-300/80 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                        {webhookStatus?.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950/70">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Delivery URL
                      </p>
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        {process.env.NEXT_PUBLIC_APP_URL
                          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`
                          : 'Set NEXT_PUBLIC_APP_URL first'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950/70">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Events installed
                      </p>
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        {webhookStatus?.events.length
                          ? webhookStatus.events.join(', ')
                          : 'No webhook events reported yet'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950/70">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Last GitHub response
                      </p>
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        {webhookStatus?.lastResponse
                          ? `${webhookStatus.lastResponse.status}${webhookStatus.lastResponse.code ? ` (${webhookStatus.lastResponse.code})` : ''}`
                          : 'No delivery response reported yet'}
                      </p>
                      {webhookStatus?.lastResponse?.message ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {webhookStatus.lastResponse.message}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                {/* Telegram Setup */}
                <div className="rounded-3xl border border-blue-200/50 bg-blue-50/30 px-6 py-8 dark:border-blue-900/40 dark:bg-blue-900/10">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm">
                      <MessageCircle className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Telegram Bot
                      </h3>
                      <p className="text-xs text-muted-foreground">Deliver alerts to Telegram</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {notificationEvents.map((eventType) => {
                      const rule = notificationsData?.rules.find((r) => r.provider === 'TELEGRAM')
                      const isEnabled = rule?.events.includes(eventType) ?? false

                      return (
                        <label
                          key={`tg-${eventType}`}
                          className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800"
                        >
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            className="mt-1 size-5 rounded border-slate-300 transition-all focus:ring-2 focus:ring-blue-500"
                            disabled={updateRule.isPending}
                            onChange={(e) => {
                              const currentEvents = rule?.events ?? []
                              const newEvents = e.target.checked
                                ? [...currentEvents, eventType]
                                : currentEvents.filter((ev) => ev !== eventType)

                              updateRule.mutate(
                                {
                                  provider: 'TELEGRAM',
                                  events: newEvents,
                                },
                                {
                                  onError: (err) => {
                                    toast.error(err.message || 'Failed to update rule')
                                  },
                                }
                              )
                            }}
                          />
                          <div>
                            <span className="block text-sm font-medium capitalize text-slate-800 dark:text-slate-200">
                              {eventType === 'push' ? 'Commits (Pushes)' : eventType.replace('_', ' ')}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                              {eventType === 'issues' && 'Alert when new issues are opened.'}
                              {eventType === 'pull_request' && 'Alert when code is submitted for review.'}
                              {eventType === 'push' && 'Alert when new code is pushed to this repo.'}
                              {eventType === 'issue_comment' && 'Alert when someone adds a new issue or PR comment.'}
                            </span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Discord Setup */}
                <div className="rounded-3xl border border-indigo-200/50 bg-indigo-50/30 px-6 py-8 dark:border-indigo-900/40 dark:bg-indigo-900/10">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm">
                      <MessageCircle className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Discord Bot
                      </h3>
                      <p className="text-xs text-muted-foreground">Deliver alerts to Discord</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {notificationEvents.map((eventType) => {
                      const isEnabled = discordRule?.events.includes(eventType) ?? false
                      const currentOverrides =
                        discordRule?.channelOverrides &&
                        typeof discordRule.channelOverrides === 'object'
                          ? discordRule.channelOverrides
                          : {}
                      const selectedChannelId = currentOverrides?.[eventType] ?? ''

                      return (
                        <div
                          key={`dc-${eventType}`}
                          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800"
                        >
                          <label className="flex cursor-pointer items-start gap-4">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              className="mt-1 size-5 rounded border-slate-300 transition-all focus:ring-2 focus:ring-indigo-500"
                              disabled={updateRule.isPending}
                              onChange={(e) => {
                                const currentEvents = discordRule?.events ?? []
                                const newEvents = e.target.checked
                                  ? [...currentEvents, eventType]
                                  : currentEvents.filter((ev) => ev !== eventType)

                                const nextOverrides = { ...currentOverrides }
                                if (!e.target.checked) {
                                  delete nextOverrides[eventType]
                                }

                                updateRule.mutate(
                                  {
                                    provider: 'DISCORD',
                                    events: newEvents,
                                    channelOverrides: nextOverrides,
                                  },
                                  {
                                    onError: (err) => {
                                      toast.error(err.message || 'Failed to update rule')
                                    },
                                  }
                                )
                              }}
                            />
                            <div>
                              <span className="block text-sm font-medium capitalize text-slate-800 dark:text-slate-200">
                                {eventType === 'push' ? 'Commits (Pushes)' : eventType.replace('_', ' ')}
                              </span>
                              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                {eventType === 'issues' && 'Alert when new issues are opened.'}
                                {eventType === 'pull_request' && 'Alert when code is submitted for review.'}
                                {eventType === 'push' && 'Alert when new code is pushed to this repo.'}
                                {eventType === 'issue_comment' && 'Alert when someone adds a new issue or PR comment.'}
                              </span>
                            </div>
                          </label>

                          <div className="space-y-2">
                            <label className="block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                              Discord channel
                            </label>
                            <select
                              value={selectedChannelId}
                              disabled={
                                updateRule.isPending ||
                                !discordChannels.length ||
                                !isEnabled
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-indigo-500/40 dark:focus:ring-indigo-500/20"
                              onChange={(e) => {
                                const nextOverrides = { ...currentOverrides }
                                const nextValue = e.target.value

                                if (nextValue) {
                                  nextOverrides[eventType] = nextValue
                                } else {
                                  delete nextOverrides[eventType]
                                }

                                updateRule.mutate(
                                  {
                                    provider: 'DISCORD',
                                    events: discordRule?.events ?? [],
                                    channelOverrides: nextOverrides,
                                  },
                                  {
                                    onError: (err) => {
                                      toast.error(err.message || 'Failed to update rule')
                                    },
                                  }
                                )
                              }}
                            >
                              <option value="">
                                Use linked default channel
                              </option>
                              {discordChannels.map((channel) => (
                                <option key={channel.id} value={channel.id}>
                                  #{channel.name}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-muted-foreground">
                              Choose a dedicated text channel for this event, or leave it on the linked default.
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
