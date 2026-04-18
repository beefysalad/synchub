'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  ExternalLink,
  FolderGit2,
  GitBranch,
  GitCommit,
  GitPullRequest,
  MessageSquareMore,
  PlayCircle,
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
import { Spinner } from '@/components/ui/spinner'
import { useGithubBranches } from '@/hooks/use-github-branches'
import { useGithubCommits } from '@/hooks/use-github-commits'
import { useGithubIssues } from '@/hooks/use-github-issues'
import { useGithubPulls } from '@/hooks/use-github-pulls'
import { useGithubWorkflows } from '@/hooks/use-github-workflows'
import {
  useGithubRepositories,
  useUpdateGithubPreferences,
} from '@/hooks/use-github-repositories'
import type { GitHubIssueState } from '@/lib/github/types'

import { RepositoryWorkflowsTab } from './repository-workflows-tab'
import { RepositoryBranchesTab } from './repository-branches-tab'

const issueTypeFilters = ['all', 'bug', 'task', 'feature'] as const

type ActivityTab = 'issues' | 'pulls' | 'commits' | 'workflows' | 'branches'
type IssueTypeFilter = (typeof issueTypeFilters)[number]
type PaginationState = {
  key: string
  page: number
}

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
  workflows: {
    label: 'Workflows',
    icon: PlayCircle,
    title: 'Automations & CI/CD',
    description: 'Monitor your configured default workflows and recent runs.',
    emptyMessage: 'No workflows configured for this repository.',
    accentClassName:
      'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
  },
  branches: {
    label: 'Branches',
    icon: GitBranch,
    title: 'Branch activity',
    description: 'Browse repository branches and open pull requests directly from SyncHub.',
    emptyMessage: 'No branches found for this repository.',
    accentClassName:
      'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400',
  },
}

function getIssueLabelStyles(color: string) {
  const normalized = color.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  
  // Calculate relative lightness based on YIQ equation
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  const isLight = yiq >= 128

  return {
    backgroundColor: `#${normalized}`,
    color: isLight ? '#24292f' : '#ffffff',
    borderColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
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
  icon: React.ElementType
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap px-1 pb-4 text-xs font-semibold transition-all duration-300 ${
        active
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="size-4" />
      {label}
      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-bold">
        {count}
      </span>
      {active && (
        <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary rounded-t-full" />
      )}
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

function PaginationControls({
  page,
  hasNextPage,
  isLoading,
  onPrevious,
  onNext,
}: {
  page: number
  hasNextPage: boolean
  isLoading: boolean
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-5">
      <p className="text-muted-foreground text-sm">
        Page {page}
        {isLoading ? ' • Updating...' : ''}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={page <= 1 || isLoading}
          onClick={onPrevious}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={!hasNextPage || isLoading}
          onClick={onNext}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
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
  const [issueTypeFilter, setIssueTypeFilter] =
    useState<IssueTypeFilter>('all')
  const repositoryFullName = `${owner}/${repo}`
  const issuePaginationKey = `${repositoryFullName}:${issueState}:${issueTypeFilter}`
  const pullPaginationKey = `${repositoryFullName}:${issueState}`
  const commitPaginationKey = repositoryFullName
  const [issuePaginationState, setIssuePaginationState] =
    useState<PaginationState>({
      key: issuePaginationKey,
      page: 1,
    })
  const [pullPaginationState, setPullPaginationState] = useState<PaginationState>(
    {
      key: pullPaginationKey,
      page: 1,
    }
  )
  const [commitPaginationState, setCommitPaginationState] =
    useState<PaginationState>({
      key: commitPaginationKey,
      page: 1,
    })
  const issuePage =
    issuePaginationState.key === issuePaginationKey
      ? issuePaginationState.page
      : 1
  const pullPage =
    pullPaginationState.key === pullPaginationKey ? pullPaginationState.page : 1
  const commitPage =
    commitPaginationState.key === commitPaginationKey
      ? commitPaginationState.page
      : 1

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
    page: issuePage,
    perPage: 12,
    label: issueTypeFilter === 'all' ? undefined : issueTypeFilter,
  })

  const {
    data: pullsData,
    isLoading: isLoadingPulls,
    isFetching: isFetchingPulls,
  } = useGithubPulls({
    owner,
    repo,
    state: issueState as 'open' | 'closed' | 'all',
    page: pullPage,
    perPage: 10,
  })

  const {
    data: commitsData,
    isLoading: isLoadingCommits,
    isFetching: isFetchingCommits,
  } = useGithubCommits({
    owner,
    repo,
    page: commitPage,
    perPage: 10,
  })
  const { data: workflowsData } = useGithubWorkflows({
    owner,
    repo,
  })
  const { data: branchesData } = useGithubBranches({
    owner,
    repo,
  })

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
  const workflows = workflowsData?.workflows ?? []
  const branches = branchesData?.branches ?? []
  const issuesPagination = issuesData?.pagination ?? {
    page: issuePage,
    perPage: 12,
    hasNextPage: false,
  }
  const pullsPagination = pullsData?.pagination ?? {
    page: pullPage,
    perPage: 10,
    hasNextPage: false,
  }
  const commitsPagination = commitsData?.pagination ?? {
    page: commitPage,
    perPage: 10,
    hasNextPage: false,
  }
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
          <div className="flex flex-wrap items-center gap-2">
            {!isTracked ? (
              <Button size="sm" variant="outline" onClick={handleTrackRepository} disabled={isUpdatingPreferences}>
                {isUpdatingPreferences ? <Spinner className="mr-2 size-3" /> : null} Track
              </Button>
            ) : null}
            {!isDefault ? (
              <Button size="sm" variant="outline" onClick={handleSetDefaultRepository} disabled={isUpdatingPreferences}>
                {isUpdatingPreferences ? <Spinner className="mr-2 size-3" /> : null} Set default
              </Button>
            ) : null}
            <Button size="sm" asChild variant="outline">
              <Link href="/repos"><ArrowLeft className="mr-2 size-4" />Back</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/issues/${owner}/${repo}/new`}><Plus className="mr-2 size-4" />New issue</Link>
            </Button>
            <Button size="sm" asChild variant="outline">
              <Link href={repository?.html_url ?? `https://github.com/${owner}/${repo}`} target="_blank">
                <ExternalLink className="mr-2 size-4" />GitHub
              </Link>
            </Button>
            <Button size="sm" asChild variant="ghost" className="px-2 text-muted-foreground">
              <Link href={`/repos/${owner}/${repo}/settings`}><Settings className="size-4" /></Link>
            </Button>
          </div>
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

      <div className="border-b border-border flex items-center gap-6 pt-2 overflow-x-auto scrollbar-hide">
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
        <WorkspaceTabButton
          active={activeTab === 'workflows'}
          count={workflows.length}
          icon={PlayCircle}
          label="Workflows"
          onClick={() => setActiveTab('workflows')}
        />
        <WorkspaceTabButton
          active={activeTab === 'branches'}
          count={branches.length}
          icon={GitBranch}
          label="Branches"
          onClick={() => setActiveTab('branches')}
        />
      </div>

      <div className="pt-2">
        {activeTab === 'issues' || activeTab === 'pulls' ? (
          <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border bg-slate-50 dark:bg-slate-900/50 px-4 py-3">
              <div className="flex items-center gap-4 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setIssueState('open')}
                  className={`flex items-center gap-2 ${issueState === 'open' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <CircleDot className="size-4" />
                  {activeTab === 'issues' ? `${issues.length} Open` : `${pulls.length} Open`}
                </button>
                <button
                  type="button"
                  onClick={() => setIssueState('closed')}
                  className={`flex items-center gap-2 ${issueState === 'closed' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <CheckCircle2 className="size-4" />
                  Closed
                </button>
              </div>
              {activeTab === 'issues' && (
                <div className="flex items-center gap-2 mt-3 sm:mt-0">
                  {issueTypeFilters.map((typeOption) => (
                    <button
                      key={typeOption}
                      type="button"
                      onClick={() => setIssueTypeFilter(typeOption)}
                      className={`text-xs font-semibold tracking-wide capitalize px-2 py-1 rounded-md transition-colors ${issueTypeFilter === typeOption ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-foreground'}`}
                    >
                      {typeOption}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="divide-y divide-border">
              {activeTab === 'issues' ? (
                isLoadingIssues ? (
                  <ActivityEmptyState message="Syncing issues from GitHub..." />
                ) : issues.length ? (
                  issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="group flex gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 items-start"
                    >
                      <div className="shrink-0 pt-0.5">
                        {issue.state === 'open' ? (
                          <CircleDot className="text-[#1a7f37] dark:text-[#3fb950] size-4" />
                        ) : (
                          <CheckCircle2 className="text-[#8250df] dark:text-[#a371f7] size-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/issues/${owner}/${repo}/${issue.number}`} className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                            {issue.title}
                          </Link>
                          {issue.labels.slice(0, 5).map((label) => (
                            <span
                              key={label.id}
                              className="rounded-full border px-2 py-0.5 text-[12px] font-medium"
                              style={getIssueLabelStyles(label.color)}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          #{issue.number} opened {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })} by <span className="text-muted-foreground hover:text-primary transition-colors">{issue.user.login}</span>
                        </p>
                      </div>
                      {issue.comments > 0 && (
                        <div className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
                          <Link href={`/issues/${owner}/${repo}/${issue.number}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                            <MessageSquareMore className="size-3.5" />
                            {issue.comments}
                          </Link>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <ActivityEmptyState message={tabConfig.emptyMessage} />
                )
              ) : null}

              {activeTab === 'pulls' ? (
                isLoadingPulls ? (
                  <ActivityEmptyState message="Syncing pull requests from GitHub..." />
                ) : pulls.length ? (
                  pulls.map((pull) => (
                    <div
                      key={pull.id}
                      className="group flex gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 items-start"
                    >
                      <div className="shrink-0 pt-0.5">
                        {pull.state === 'open' ? (
                          <GitPullRequest className="text-[#1a7f37] dark:text-[#3fb950] size-4" />
                        ) : (
                          <GitPullRequest className="text-[#8250df] dark:text-[#a371f7] size-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/pulls/${owner}/${repo}/${pull.number}`} className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                            {pull.title}
                          </Link>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          #{pull.number} opened {formatDistanceToNow(new Date(pull.created_at), { addSuffix: true })} by <span className="text-muted-foreground hover:text-primary transition-colors">{pull.user.login}</span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <ActivityEmptyState message={tabConfig.emptyMessage} />
                )
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === 'commits' ? (
          isLoadingCommits ? (
            <ActivityEmptyState message="Syncing recent commits from GitHub..." />
          ) : commits.length ? (
            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm divide-y divide-border">
              {commits.map((commit) => (
                <div
                  key={commit.sha}
                  className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors">
                      {commit.commit.message.split('\n')[0]}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {commit.author?.login ?? commit.commit.author.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        committed {formatDistanceToNow(new Date(commit.commit.author.date), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {commit.sha.substring(0, 7)}
                    </span>
                    <Button asChild variant="ghost" className="h-7 px-2.5 text-xs text-muted-foreground">
                      <Link href={commit.html_url} target="_blank">
                        <ExternalLink className="mr-1.5 size-3.5" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ActivityEmptyState message={tabConfig.emptyMessage} />
          )
        ) : null}

        {activeTab === 'workflows' ? (
          <RepositoryWorkflowsTab owner={owner} repo={repo} />
        ) : null}

        {activeTab === 'branches' ? (
          <RepositoryBranchesTab owner={owner} repo={repo} />
        ) : null}

        {activeTab === 'issues' && issues.length ? (
          <PaginationControls
            page={issuesPagination.page}
            hasNextPage={issuesPagination.hasNextPage}
            isLoading={isFetchingIssues}
            onPrevious={() => setIssuePaginationState(c => ({ key: issuePaginationKey, page: Math.max(1, c.page - 1) }))}
            onNext={() => setIssuePaginationState(c => ({ key: issuePaginationKey, page: c.page + 1 }))}
          />
        ) : null}
        
        {activeTab === 'pulls' && pulls.length ? (
          <PaginationControls
            page={pullsPagination.page}
            hasNextPage={pullsPagination.hasNextPage}
            isLoading={isFetchingPulls}
            onPrevious={() => setPullPaginationState(c => ({ key: pullPaginationKey, page: Math.max(1, c.page - 1) }))}
            onNext={() => setPullPaginationState(c => ({ key: pullPaginationKey, page: c.page + 1 }))}
          />
        ) : null}

        {activeTab === 'commits' && commits.length ? (
          <PaginationControls
            page={commitsPagination.page}
            hasNextPage={commitsPagination.hasNextPage}
            isLoading={isFetchingCommits}
            onPrevious={() => setCommitPaginationState(c => ({ key: commitPaginationKey, page: Math.max(1, c.page - 1) }))}
            onNext={() => setCommitPaginationState(c => ({ key: commitPaginationKey, page: c.page + 1 }))}
          />
        ) : null}
      </div>
    </div>
  )
}
