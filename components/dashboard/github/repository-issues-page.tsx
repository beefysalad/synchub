'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  ExternalLink,
  FolderGit2,
  MessageSquareMore,
  Plus,
  Star,
  GitPullRequest,
  GitCommit,
  Bell,
  MessageCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

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
import { Spinner } from '@/components/ui/spinner'
import { useGithubIssues } from '@/hooks/use-github-issues'
import { useGithubPulls } from '@/hooks/use-github-pulls'
import { useGithubCommits } from '@/hooks/use-github-commits'
import {
  useGithubRepositories,
  useUpdateGithubPreferences,
} from '@/hooks/use-github-repositories'
import {
  useGithubNotifications,
  useUpdateNotificationRule,
} from '@/hooks/use-github-notifications'
import type { GitHubIssueState } from '@/lib/github/types'

const issueStates: GitHubIssueState[] = ['open', 'all', 'closed']

export function RepositoryIssuesPage({
  owner,
  repo,
}: {
  owner: string
  repo: string
}) {
  const [activeTab, setActiveTab] = useState<'issues' | 'pulls' | 'commits' | 'notifications'>('issues')
  const [issueState, setIssueState] = useState<GitHubIssueState>('open')

  const { data: repositoryData } = useGithubRepositories()
  const updatePreferences = useUpdateGithubPreferences()

  const {
    data: issuesData,
    isLoading: isLoadingIssues,
    isFetching: isFetchingIssues,
    error: errorIssues,
  } = useGithubIssues({
    owner,
    repo,
    state: issueState,
  })

  const {
    data: pullsData,
    isLoading: isLoadingPulls,
  } = useGithubPulls({
    owner,
    repo,
    state: issueState as 'open' | 'closed' | 'all',
  })

  const {
    data: commitsData,
    isLoading: isLoadingCommits,
  } = useGithubCommits({ owner, repo })

  const { data: notificationsData, isLoading: isLoadingNotifications } =
    useGithubNotifications(owner, repo)

  const updateRule = useUpdateNotificationRule(owner, repo)

  const repositoryFullName = `${owner}/${repo}`
  const repository =
    repositoryData?.repositories.find(
      (candidate) => candidate.full_name === repositoryFullName
    ) ?? null
  const preferences = repositoryData?.preferences ?? {
    defaultRepository: null,
    selectedRepositories: [],
  }

  const issues = issuesData?.issues ?? []
  const pulls = pullsData?.pulls ?? []
  const commits = commitsData?.commits ?? []

  const isTracked = preferences.selectedRepositories.includes(repositoryFullName)
  const isDefault = preferences.defaultRepository === repositoryFullName

  function handleTrackRepository() {
    updatePreferences.mutate(
      {
        selectedRepositories: Array.from(
          new Set([...preferences.selectedRepositories, repositoryFullName])
        ),
        defaultRepository:
          preferences.defaultRepository ?? repositoryFullName,
      },
      {
        onSuccess: () => {
          toast.success(`${repositoryFullName} added to tracked repositories.`)
        },
        onError: (mutationError) => {
          toast.error(mutationError.message)
        },
      }
    )
  }

  function handleSetDefaultRepository() {
    updatePreferences.mutate(
      {
        selectedRepositories: Array.from(
          new Set([...preferences.selectedRepositories, repositoryFullName])
        ),
        defaultRepository: repositoryFullName,
      },
      {
        onSuccess: () => {
          toast.success(`${repositoryFullName} is now the default repository.`)
        },
        onError: (mutationError) => {
          toast.error(mutationError.message)
        },
      }
    )
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Repository Workspace"
        title={repositoryFullName}
        description={
          repository?.description ??
          'Browse the current issues in this repository and jump into a fresh issue draft when you need one.'
        }
        actions={
          <>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/issues">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href={`/issues/${owner}/${repo}/new`}>
                <Plus className="size-4" />
                New issue
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

      {errorIssues ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
          {errorIssues.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={FolderGit2}
          label="Filter state"
          value={issueState}
          detail="Currently matching state for standard issues and PRs."
        />
        <StatusCard
          icon={MessageSquareMore}
          label="Active items"
          value={String(issues.length + pulls.length)}
          detail="Total open issues and pull requests currently loaded."
        />
        <StatusCard
          icon={Star}
          label="Tracking"
          value={isTracked ? 'Tracked' : 'Not tracked'}
          detail="Whether this repository appears on your tracked repo dashboard."
        />
        <StatusCard
          icon={Plus}
          label="Default repo"
          value={isDefault ? 'Yes' : 'No'}
          detail="Used when SyncHub needs a fallback repository for future actions."
        />
      </div>

      <div className="flex items-center gap-2 border-b border-white/20 pb-4 dark:border-slate-800">
        <Button
          variant={activeTab === 'issues' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('issues')}
          className="rounded-full font-medium"
        >
          <MessageSquareMore className="mr-2 size-4" />
          Issues
        </Button>
        <Button
          variant={activeTab === 'pulls' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('pulls')}
          className="rounded-full font-medium"
        >
          <GitPullRequest className="mr-2 size-4" />
          Pull Requests
        </Button>
        <Button
          variant={activeTab === 'commits' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('commits')}
          className="rounded-full font-medium"
        >
          <GitCommit className="mr-2 size-4" />
          Commits
        </Button>
        <Button
          variant={activeTab === 'notifications' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('notifications')}
          className="rounded-full font-medium ml-auto"
        >
          <Bell className="mr-2 size-4" />
          Notifications
        </Button>
      </div>

      <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>
              {activeTab === 'issues' && 'Current issues'}
              {activeTab === 'pulls' && 'Active Pull Requests'}
              {activeTab === 'commits' && 'Recent Branch Commits'}
              {activeTab === 'notifications' && 'Broadcast Rules'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'issues' && 'Filter and inspect standard issues natively.'}
              {activeTab === 'pulls' && 'Review code submissions before merging.'}
              {activeTab === 'commits' && 'Monitor direct branch pushes in real-time.'}
              {activeTab === 'notifications' && 'Route real-time GitHub events directly to your bots.'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {(activeTab === 'issues' || activeTab === 'pulls') &&
              issueStates.map((stateOption) => (
                <Button
                  key={stateOption}
                  type="button"
                  variant={issueState === stateOption ? 'default' : 'outline'}
                  className="rounded-full capitalize"
                  onClick={() => setIssueState(stateOption)}
                  disabled={isFetchingIssues}
                >
                  {issueState === stateOption && isFetchingIssues ? (
                    <>
                      <Spinner />
                      Loading...
                    </>
                  ) : (
                    stateOption
                  )}
                </Button>
              ))}
            {!isTracked ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={handleTrackRepository}
                disabled={updatePreferences.isPending}
              >
                {updatePreferences.isPending ? (
                  <>
                    <Spinner />
                    Tracking...
                  </>
                ) : (
                  'Track repository'
                )}
              </Button>
            ) : null}
            {!isDefault ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={handleSetDefaultRepository}
                disabled={updatePreferences.isPending}
              >
                {updatePreferences.isPending ? (
                  <>
                    <Spinner />
                    Saving...
                  </>
                ) : (
                  'Set default'
                )}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === 'issues' && (
            <>
              {isLoadingIssues ? (
                <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm text-muted-foreground dark:border-slate-700">
                  Loading issues from GitHub...
                </div>
              ) : issues.length ? (
                issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="rounded-3xl border border-slate-200/70 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-950">
                            #{issue.number}
                          </span>
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs capitalize text-muted-foreground dark:border-slate-700">
                            {issue.state}
                          </span>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{issue.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Opened by {issue.user.login}{' '}
                            {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="outline" className="rounded-full shrink-0">
                        <Link href={`/issues/${owner}/${repo}/${issue.number}`}>
                          Open issue
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm text-muted-foreground dark:border-slate-700">
                  No issues matched this filter. Create a new issue to get started.
                </div>
              )}
            </>
          )}

          {activeTab === 'pulls' && (
            <>
              {isLoadingPulls ? (
                <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm text-muted-foreground dark:border-slate-700">
                  Loading pull requests from GitHub...
                </div>
              ) : pulls.length ? (
                pulls.map((pull) => (
                  <div
                    key={pull.id}
                    className="rounded-3xl border border-blue-200/50 bg-blue-50/30 px-5 py-5 dark:border-blue-900/40 dark:bg-blue-900/10"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white dark:bg-blue-500">
                            PR #{pull.number}
                          </span>
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs capitalize text-muted-foreground dark:border-slate-700">
                            {pull.state}
                          </span>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{pull.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Authored by {pull.user.login}{' '}
                            {formatDistanceToNow(new Date(pull.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="outline" className="rounded-full shrink-0">
                        <Link href={`/pulls/${owner}/${repo}/${pull.number}`}>
                          Review PR
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm text-muted-foreground dark:border-slate-700">
                  No active pull requests found.
                </div>
              )}
            </>
          )}

          {activeTab === 'commits' && (
            <>
              {isLoadingCommits ? (
                <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm text-muted-foreground dark:border-slate-700">
                  Loading recent commits from GitHub...
                </div>
              ) : commits.length ? (
                <div className="divide-y border-t border-slate-200 dark:border-slate-800">
                  {commits.map((commit) => (
                    <div key={commit.sha} className="flex gap-4 py-4">
                      <div className="mt-1 size-2 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {commit.commit.message}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {commit.author?.login ?? commit.commit.author.name} pushed{' '}
                          {formatDistanceToNow(new Date(commit.commit.author.date), {
                            addSuffix: true,
                          })}
                        </p>
                        <a
                          href={commit.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {commit.sha.substring(0, 7)}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm text-muted-foreground dark:border-slate-700">
                  No recent commits found on the default branch.
                </div>
              )}
            </>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {isLoadingNotifications ? (
                <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm text-muted-foreground dark:border-slate-700">
                  <Spinner className="mr-2 inline size-4" /> Loading your notification rules...
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Telegram Setup */}
                  <div className="rounded-3xl border border-blue-200/50 bg-blue-50/30 px-5 py-6 dark:border-blue-900/40 dark:bg-blue-900/10">
                    <div className="mb-4 flex items-center gap-2">
                      <MessageCircle className="size-6 text-blue-500" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Telegram Bot
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {(['issues', 'pull_request', 'push'] as const).map((eventType) => {
                        const rule = notificationsData?.rules.find((r) => r.provider === 'TELEGRAM')
                        const isEnabled = rule?.events.includes(eventType) ?? false

                        return (
                          <label key={`tg-${eventType}`} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              className="size-4 rounded border-slate-300"
                              disabled={updateRule.isPending}
                              onChange={(e) => {
                                const currentEvents = rule?.events ?? []
                                const newEvents = e.target.checked
                                  ? [...currentEvents, eventType]
                                  : currentEvents.filter((ev) => ev !== eventType)

                                updateRule.mutate({
                                  provider: 'TELEGRAM',
                                  events: newEvents,
                                })
                              }}
                            />
                            <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                              {eventType.replace('_', ' ')}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Discord Setup */}
                  <div className="rounded-3xl border border-indigo-200/50 bg-indigo-50/30 px-5 py-6 dark:border-indigo-900/40 dark:bg-indigo-900/10">
                    <div className="mb-4 flex items-center gap-2">
                      <MessageCircle className="size-6 text-indigo-500" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Discord Bot
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {(['issues', 'pull_request', 'push'] as const).map((eventType) => {
                        const rule = notificationsData?.rules.find((r) => r.provider === 'DISCORD')
                        const isEnabled = rule?.events.includes(eventType) ?? false

                        return (
                          <label key={`dc-${eventType}`} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              className="size-4 rounded border-slate-300"
                              disabled={updateRule.isPending}
                              onChange={(e) => {
                                const currentEvents = rule?.events ?? []
                                const newEvents = e.target.checked
                                  ? [...currentEvents, eventType]
                                  : currentEvents.filter((ev) => ev !== eventType)

                                updateRule.mutate({
                                  provider: 'DISCORD',
                                  events: newEvents,
                                })
                              }}
                            />
                            <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                              {eventType.replace('_', ' ')}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
