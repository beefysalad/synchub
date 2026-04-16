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
    accentClassName:
      'border-emerald-200/70 bg-emerald-50/60 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100',
  },
  pulls: {
    label: 'Pull requests',
    icon: GitPullRequest,
    title: 'Review flow',
    description:
      'Review active PRs and jump into code changes that need attention.',
    emptyMessage: 'No pull requests matched this filter.',
    accentClassName:
      'border-sky-200/70 bg-sky-50/60 text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100',
  },
  commits: {
    label: 'Commits',
    icon: GitCommit,
    title: 'Recent branch activity',
    description: 'Watch recent pushes land on the default branch in real time.',
    emptyMessage: 'No recent commits found on the default branch.',
    accentClassName:
      'border-violet-200/70 bg-violet-50/60 text-violet-900 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-100',
  },
}

function getIssueLabelStyles(color: string) {
  const normalized = color.replace('#', '')
  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255

  return {
    backgroundColor: `#${normalized}26`,
    borderColor: `#${normalized}55`,
    color: luminance > 0.62 ? '#0f172a' : `#${normalized}`,
  }
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
      className={`group flex min-w-[160px] flex-1 items-center justify-between rounded-3xl border px-4 py-4 text-left transition ${
        active
          ? 'border-emerald-200 bg-emerald-50 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10'
          : 'border-slate-200/70 bg-white/70 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-2xl ${
            active
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <Icon className="size-4" />
        </div>
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {active ? 'Currently selected' : 'Switch view'}
          </p>
        </div>
      </div>
      <span className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">
        {count}
      </span>
    </button>
  )
}

function ActivityEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-400/80 bg-slate-50 px-5 py-8 text-sm text-slate-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-300">
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
    updatePreferences.mutate(
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

  const tabConfig = tabMeta[activeTab]

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Repository Workspace"
        title={repositoryFullName}
        description={
          repository?.description ??
          'Browse issues, review pull requests, and follow recent commits without leaving SyncHub.'
        }
        actions={
          <>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/repos">
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
                href={
                  repository?.html_url ?? `https://github.com/${owner}/${repo}`
                }
                target="_blank"
              >
                <ExternalLink className="size-4" />
                Open in GitHub
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-full bg-slate-100/50 text-slate-600 hover:text-slate-900 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:text-slate-100"
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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/70 bg-white shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader className="space-y-3">
            <CardTitle className="text-slate-950 dark:text-slate-50">
              Repository activity
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Move between the issue queue, review flow, and recent branch
              activity from one place.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
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
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle className="text-slate-950 dark:text-slate-50">
              Workspace controls
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Keep this repository close at hand and tune the list state while
              you work.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`rounded-3xl border px-4 py-4 ${tabConfig.accentClassName}`}
            >
              <div className="flex items-center gap-2">
                <p className="font-medium">{tabConfig.title}</p>
              </div>
              <p className="mt-2 text-sm opacity-90">{tabConfig.description}</p>
            </div>

            {(activeTab === 'issues' || activeTab === 'pulls') && (
              <div className="flex flex-wrap gap-2">
                {issueStates.map((stateOption) => (
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
              </div>
            )}

            <div className="flex flex-wrap gap-2">
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
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-2xl text-slate-950 dark:text-slate-50">
              {tabConfig.title}
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {tabConfig.description}
            </CardDescription>
          </div>
          <div
            className={`rounded-full border px-3 py-1 text-xs font-medium ${tabConfig.accentClassName}`}
          >
            {activeTab === 'issues' && `${issues.length} issues`}
            {activeTab === 'pulls' && `${pulls.length} pull requests`}
            {activeTab === 'commits' && `${commits.length} commits`}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === 'issues' &&
            (isLoadingIssues ? (
              <ActivityEmptyState message="Loading issues from GitHub..." />
            ) : issues.length ? (
              issues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-3xl border border-slate-300 bg-white px-5 py-5 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-950">
                          #{issue.number}
                        </span>
                        <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium capitalize text-slate-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-300">
                          {issue.state}
                        </span>
                        {issue.labels.slice(0, 3).map((label) => (
                          <span
                            key={label.id}
                            className="rounded-full border px-3 py-1 text-xs font-semibold"
                            style={getIssueLabelStyles(label.color)}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                          {issue.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                          Opened by {issue.user.login}{' '}
                          {formatDistanceToNow(new Date(issue.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="shrink-0 rounded-full"
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
              <ActivityEmptyState message="Loading pull requests from GitHub..." />
            ) : pulls.length ? (
              pulls.map((pull) => (
                <div
                  key={pull.id}
                  className="rounded-3xl border border-sky-300 bg-white px-5 py-5 shadow-sm transition hover:border-sky-500 hover:shadow-md dark:border-sky-900/40 dark:bg-slate-900/70 dark:hover:border-sky-700 dark:hover:bg-slate-900"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-sky-600 px-3 py-1 text-xs font-medium text-white dark:bg-sky-500">
                          PR #{pull.number}
                        </span>
                        <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium capitalize text-slate-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-300">
                          {pull.state}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                          {pull.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                          Authored by {pull.user.login}{' '}
                          {formatDistanceToNow(new Date(pull.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="shrink-0 rounded-full"
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
              <ActivityEmptyState message="Loading recent commits from GitHub..." />
            ) : commits.length ? (
              <div className="space-y-3">
                {commits.map((commit) => (
                  <div
                    key={commit.sha}
                    className="rounded-3xl border border-violet-300 bg-white px-5 py-5 shadow-sm transition hover:border-violet-500 hover:shadow-md dark:border-violet-900/40 dark:bg-slate-900/70 dark:hover:border-violet-700 dark:hover:bg-slate-900"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white dark:bg-violet-500">
                            {commit.sha.slice(0, 7)}
                          </span>
                          <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-300">
                            {commit.author?.login ?? commit.commit.author.name}
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                          {commit.commit.message}
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          Pushed{' '}
                          {formatDistanceToNow(
                            new Date(commit.commit.author.date),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        className="shrink-0 rounded-full"
                      >
                        <Link href={commit.html_url} target="_blank">
                          <ExternalLink className="size-4" />
                          View commit
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
