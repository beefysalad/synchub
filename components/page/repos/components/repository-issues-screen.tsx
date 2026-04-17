'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  ExternalLink,
  FolderGit2,
  GitCommit,
  GitPullRequest,
  MessageSquareMore,
  Plus,
  Settings,
  Star,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { SectionHeader } from '@/components/shared/section-header'
import { StatusCard } from '@/components/shared/status-card'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useGithubCommits } from '@/hooks/use-github-commits'
import { useGithubIssues } from '@/hooks/use-github-issues'
import { useGithubPulls } from '@/hooks/use-github-pulls'
import {
  useGithubRepositories,
  useUpdateGithubPreferences,
} from '@/hooks/use-github-repositories'
import type { GitHubIssueState } from '@/lib/github/types'

const issueStates: GitHubIssueState[] = ['open', 'all', 'closed']

type ActivityTab = 'issues' | 'pulls' | 'commits'

const tabMeta: Record<
  ActivityTab,
  {
    label: string
    icon: typeof MessageSquareMore
    title: string
    description: string
    emptyMessage: string
    accentClassName: string
  }
> = {
  issues: {
    label: 'Issues',
    icon: MessageSquareMore,
    title: 'Issue queue',
    description: 'Follow open bugs, requests, and triage-ready work items.',
    emptyMessage:
      'No issues matched this filter. Create a new issue to get started.',
    accentClassName: 'border-primary/20 bg-primary/5 text-primary',
  },
  pulls: {
    label: 'Pull requests',
    icon: GitPullRequest,
    title: 'Review flow',
    description:
      'Review active PRs and jump into code changes that need attention.',
    emptyMessage: 'No pull requests matched this filter.',
    accentClassName:
      'border-sky-500/20 bg-sky-500/5 text-sky-600 dark:text-sky-400',
  },
  commits: {
    label: 'Commits',
    icon: GitCommit,
    title: 'Recent branch activity',
    description: 'Watch recent pushes land on the default branch in real time.',
    emptyMessage: 'No recent commits found on the default branch.',
    accentClassName:
      'border-violet-500/20 bg-violet-500/5 text-violet-600 dark:text-violet-400',
  },
}

function getIssueLabelStyles(color: string) {
  const normalized = color.replace('#', '')
  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
  const textScale = luminance > 0.8 ? 0.32 : luminance > 0.65 ? 0.46 : 1
  const readableTextColor =
    textScale === 1
      ? `#${normalized}`
      : `rgb(${Math.round(red * textScale)}, ${Math.round(green * textScale)}, ${Math.round(blue * textScale)})`

  return {
    '--issue-label-color': readableTextColor,
    '--issue-label-background': `#${normalized}20`,
    '--issue-label-border': `#${normalized}4d`,
  } as React.CSSProperties
}

function WorkspaceTabButton({
  active,
  count,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  count: number
  icon: typeof MessageSquareMore
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-bold tracking-tight transition-all duration-300 ${
        active
          ? 'border-primary/30 bg-primary/10 text-primary shadow-sm'
          : 'border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground'
      }`}
    >
      <div
        className={`flex size-8 items-center justify-center rounded-full transition-all duration-300 ${
          active
            ? 'bg-primary text-primary-foreground shadow-primary/20 shadow-lg'
            : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
        }`}
      >
        <Icon className="size-4" />
      </div>
      <span>{label}</span>
      <span className="rounded-full border border-current/15 bg-black/5 px-2.5 py-0.5 text-[10px] font-bold tracking-wider dark:bg-white/5">
        {count}
      </span>
    </button>
  )
}

function ActivityEmptyState({ message }: { message: string }) {
  return (
    <div className="border-border text-muted-foreground rounded-3xl border border-dashed px-5 py-10 text-center text-sm transition-all duration-300">
      <div className="bg-muted/50 mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl">
        <MessageSquareMore className="size-6 opacity-20" />
      </div>
      {message}
    </div>
  )
}

export function RepositoryIssuesPage({
  owner,
  repo,
}: {
  owner: string
  repo: string
}) {
  const [activeTab, setActiveTab] = useState<ActivityTab>('issues')
  const [issueState, setIssueState] = useState<GitHubIssueState>('open')

  const { data: repositoryData } = useGithubRepositories()
  const { mutate: updatePreferences, isPending: isUpdatingPreferences } =
    useUpdateGithubPreferences()

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

  const { data: pullsData, isLoading: isLoadingPulls } = useGithubPulls({
    owner,
    repo,
    state: issueState as 'open' | 'closed' | 'all',
  })

  const { data: commitsData, isLoading: isLoadingCommits } = useGithubCommits({
    owner,
    repo,
  })

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
  const isTracked =
    preferences.selectedRepositories.includes(repositoryFullName)
  const isDefault = preferences.defaultRepository === repositoryFullName

  function handleTrackRepository() {
    updatePreferences(
      {
        selectedRepositories: Array.from(
          new Set([...preferences.selectedRepositories, repositoryFullName])
        ),
        defaultRepository: preferences.defaultRepository ?? repositoryFullName,
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
    updatePreferences(
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

  const tabConfig = tabMeta[activeTab]

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <SectionHeader
        eyebrow="Repository Workspace"
        title={repositoryFullName}
        description={
          repository?.description ??
          'Browse issues, review pull requests, and follow recent commits without leaving SyncHub.'
        }
        actions={
          <>
            <Button
              asChild
              variant="outline"
              className="rounded-full px-6 transition-all duration-300"
            >
              <Link href="/repos">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full px-6 shadow-sm transition-all duration-300"
            >
              <Link href={`/issues/${owner}/${repo}/new`}>
                <Plus className="size-4" />
                New issue
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full px-6 transition-all duration-300"
            >
              <Link
                href={
                  repository?.html_url ?? `https://github.com/${owner}/${repo}`
                }
                target="_blank"
              >
                <ExternalLink className="size-4" />
                Open GitHub
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="text-muted-foreground hover:bg-primary/5 hover:text-primary rounded-full px-4 transition-all duration-300"
            >
              <Link href={`/repos/${owner}/${repo}/settings`}>
                <Settings className="size-4" />
                Settings
              </Link>
            </Button>
          </>
        }
      />

      {errorIssues ? (
        <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-2xl border px-5 py-4 text-sm transition-all duration-300">
          {errorIssues.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={FolderGit2}
          label="Filter state"
          value={issueState}
          detail="Applied to both issues and pull requests in this workspace."
        />
        <StatusCard
          icon={MessageSquareMore}
          label="Issue queue"
          value={String(issues.length)}
          detail="Issues currently loaded for the selected repository filter."
        />
        <StatusCard
          icon={GitPullRequest}
          label="Pull requests"
          value={String(pulls.length)}
          detail="Pull requests returned for the selected state."
        />
        <StatusCard
          icon={Star}
          label="Repository status"
          value={isDefault ? 'Default' : isTracked ? 'Tracked' : 'Detached'}
          detail="Default repos act as the fallback context for future GitHub actions."
        />
      </div>

      <Card className="transition-all duration-300">
        <CardHeader className="space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Repository activity</CardTitle>
              <CardDescription className="max-w-md leading-relaxed">
                Move between issues, pull requests, and commits from one shared
                workspace.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!isTracked ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full px-6 transition-all duration-300"
                  onClick={handleTrackRepository}
                  disabled={isUpdatingPreferences}
                >
                  {isUpdatingPreferences ? (
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
                  className="rounded-full px-6 transition-all duration-300"
                  onClick={handleSetDefaultRepository}
                  disabled={isUpdatingPreferences}
                >
                  {isUpdatingPreferences ? (
                    <>
                      <Spinner />
                      Saving...
                    </>
                  ) : (
                    'Set default'
                  )}
                </Button>
              ) : null}
              <div
                className={`rounded-full border px-4 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${tabConfig.accentClassName}`}
              >
                {activeTab === 'issues' && `${issues.length} active issues`}
                {activeTab === 'pulls' && `${pulls.length} pull requests`}
                {activeTab === 'commits' && `${commits.length} recent commits`}
              </div>
            </div>
          </div>

          <div className="border-border/50 flex flex-col gap-6 border-y py-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <WorkspaceTabButton
                active={activeTab === 'issues'}
                count={issues.length}
                icon={MessageSquareMore}
                label="Issues"
                onClick={() => setActiveTab('issues')}
              />
              <WorkspaceTabButton
                active={activeTab === 'pulls'}
                count={pulls.length}
                icon={GitPullRequest}
                label="Pull requests"
                onClick={() => setActiveTab('pulls')}
              />
              <WorkspaceTabButton
                active={activeTab === 'commits'}
                count={commits.length}
                icon={GitCommit}
                label="Commits"
                onClick={() => setActiveTab('commits')}
              />
            </div>

            {activeTab === 'issues' || activeTab === 'pulls' ? (
              <div className="glass-surface flex flex-wrap items-center gap-1.5 rounded-full p-1.5 transition-all duration-300">
                {issueStates.map((stateOption) => (
                  <Button
                    key={stateOption}
                    type="button"
                    variant={issueState === stateOption ? 'default' : 'ghost'}
                    size="sm"
                    className="h-9 rounded-full px-6 font-bold tracking-tight capitalize transition-all duration-300"
                    onClick={() => setIssueState(stateOption)}
                    disabled={isFetchingIssues}
                  >
                    {issueState === stateOption && isFetchingIssues ? (
                      <>
                        <Spinner className="mr-2" />
                        Loading...
                      </>
                    ) : (
                      stateOption
                    )}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="animate-in slide-in-from-left-4 duration-500">
            <CardTitle className="text-3xl font-bold tracking-tight">
              {tabConfig.title}
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-base leading-relaxed">
              {tabConfig.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === 'issues' &&
            (isLoadingIssues ? (
              <ActivityEmptyState message="Syncing issues from GitHub..." />
            ) : issues.length ? (
              issues.map((issue) => (
                <div
                  key={issue.id}
                  className="glass-panel group hover:shadow-primary/5 relative overflow-hidden px-6 py-6 transition-all duration-300 hover:shadow-xl dark:hover:shadow-none"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-all duration-300">
                          #{issue.number}
                        </span>
                        <span className="border-border bg-background/50 text-muted-foreground rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider capitalize uppercase transition-all duration-300">
                          {issue.state}
                        </span>
                        {issue.labels.slice(0, 5).map((label) => (
                          <span
                            key={label.id}
                            className="rounded-full border border-[var(--issue-label-border)] bg-[var(--issue-label-background)] px-3 py-1 text-[10px] font-bold tracking-wider text-[var(--issue-label-color)] uppercase transition-all duration-300 dark:border-white/12 dark:bg-white/10 dark:text-white/90"
                            style={getIssueLabelStyles(label.color)}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                      <div>
                        <p className="text-foreground group-hover:text-primary text-xl font-bold tracking-tight transition-all duration-300">
                          {issue.title}
                        </p>
                        <p className="text-muted-foreground/80 mt-2 text-sm leading-relaxed transition-all duration-300">
                          Opened by{' '}
                          <span className="text-foreground font-semibold">
                            {issue.user.login}
                          </span>{' '}
                          {formatDistanceToNow(new Date(issue.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="h-12 shrink-0 rounded-full px-8 font-bold tracking-tight shadow-sm"
                    >
                      <Link href={`/issues/${owner}/${repo}/${issue.number}`}>
                        Open issue
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <ActivityEmptyState message={tabConfig.emptyMessage} />
            ))}

          {activeTab === 'pulls' &&
            (isLoadingPulls ? (
              <ActivityEmptyState message="Syncing pull requests from GitHub..." />
            ) : pulls.length ? (
              pulls.map((pull) => (
                <div
                  key={pull.id}
                  className="glass-panel group hover:shadow-primary/5 relative overflow-hidden px-6 py-6 transition-all duration-300 hover:shadow-xl dark:hover:shadow-none"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-sky-500/10 px-3 py-1 text-[10px] font-bold tracking-wider text-sky-600 uppercase transition-all duration-300 dark:text-sky-400">
                          PR #{pull.number}
                        </span>
                        <span className="border-border bg-background/50 text-muted-foreground rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider capitalize transition-all duration-300">
                          {pull.state}
                        </span>
                      </div>
                      <div>
                        <p className="text-foreground group-hover:text-primary text-xl font-bold tracking-tight transition-all duration-300">
                          {pull.title}
                        </p>
                        <p className="text-muted-foreground/80 mt-2 text-sm leading-relaxed transition-all duration-300">
                          Authored by{' '}
                          <span className="text-foreground font-semibold">
                            {pull.user.login}
                          </span>{' '}
                          {formatDistanceToNow(new Date(pull.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="hover:bg-primary hover:text-primary-foreground hover:border-primary h-12 shrink-0 rounded-full px-8 font-bold tracking-tight shadow-sm transition-all duration-300"
                    >
                      <Link href={`/pulls/${owner}/${repo}/${pull.number}`}>
                        Review PR
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <ActivityEmptyState message={tabConfig.emptyMessage} />
            ))}

          {activeTab === 'commits' &&
            (isLoadingCommits ? (
              <ActivityEmptyState message="Syncing recent commits from GitHub..." />
            ) : commits.length ? (
              <div className="grid gap-3">
                {commits.map((commit) => (
                  <div
                    key={commit.sha}
                    className="glass-surface border-border/50 group hover:border-primary/40 hover:bg-primary/5 relative overflow-hidden rounded-2xl border px-5 py-5 transition-all duration-300"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <code className="bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase transition-all duration-300">
                            {commit.sha.slice(0, 7)}
                          </code>
                          <span className="text-muted-foreground/60 text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300">
                            {commit.author?.login ?? commit.commit.author.name}
                          </span>
                        </div>
                        <p className="text-foreground group-hover:text-primary text-base font-bold tracking-tight transition-all duration-300">
                          {commit.commit.message}
                        </p>
                        <p className="text-muted-foreground/70 text-xs transition-all duration-300">
                          Pushed{' '}
                          <span className="text-foreground/80 font-medium">
                            {formatDistanceToNow(
                              new Date(commit.commit.author.date),
                              {
                                addSuffix: true,
                              }
                            )}
                          </span>
                        </p>
                      </div>
                      <Button
                        asChild
                        variant="ghost"
                        className="hover:bg-primary/10 hover:text-primary shrink-0 rounded-full px-5 transition-all duration-300"
                      >
                        <Link href={commit.html_url} target="_blank">
                          <ExternalLink className="mr-2 size-4" />
                          Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ActivityEmptyState message={tabConfig.emptyMessage} />
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
