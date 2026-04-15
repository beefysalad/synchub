'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  ExternalLink,
  FolderGit2,
  MessageSquareMore,
  Plus,
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
import { useGithubIssues } from '@/hooks/use-github-issues'
import {
  useGithubRepositories,
  useUpdateGithubPreferences,
} from '@/hooks/use-github-repositories'
import type { GitHubIssueState } from '@/lib/github/types'

const issueStates: GitHubIssueState[] = ['open', 'all', 'closed']

export function RepositoryIssuesPage({
  owner,
  repo,
}: {
  owner: string
  repo: string
}) {
  const [issueState, setIssueState] = useState<GitHubIssueState>('open')
  const { data: repositoryData } = useGithubRepositories()
  const updatePreferences = useUpdateGithubPreferences()
  const {
    data: issuesData,
    isLoading,
    isFetching,
    error,
  } = useGithubIssues({
    owner,
    repo,
    state: issueState,
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
                Back to tracked repos
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

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
          {error.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={FolderGit2}
          label="Issue state"
          value={issueState}
          detail="Current issue filter for the repository workspace."
        />
        <StatusCard
          icon={MessageSquareMore}
          label="Loaded issues"
          value={String(issues.length)}
          detail="Issues currently returned from GitHub for this repository."
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

      <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Current issues</CardTitle>
            <CardDescription>
              Filter by state, inspect active work, and open a new issue with a
              template when needed.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {issueStates.map((stateOption) => (
              <Button
                key={stateOption}
                type="button"
                variant={issueState === stateOption ? 'default' : 'outline'}
                className="rounded-full capitalize"
                onClick={() => setIssueState(stateOption)}
                disabled={isFetching}
              >
                {issueState === stateOption && isFetching ? (
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
          {isLoading ? (
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-950">
                        #{issue.number}
                      </span>
                      <span className="rounded-full border border-slate-200 px-3 py-1 text-xs capitalize text-muted-foreground dark:border-slate-700">
                        {issue.state}
                      </span>
                      {issue.labels.map((label) => (
                        <span
                          key={label.id}
                          className="rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `#${label.color}20`,
                            color: `#${label.color}`,
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>

                    <div>
                      <p className="text-lg font-semibold">{issue.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Opened by {issue.user.login}{' '}
                        {formatDistanceToNow(new Date(issue.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    {issue.body ? (
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {issue.body}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{issue.comments} comments</span>
                      <span>
                        {issue.assignees.length
                          ? `Assignees: ${issue.assignees.map((assignee) => assignee.login).join(', ')}`
                          : 'No assignees'}
                      </span>
                    </div>
                  </div>

                  <Button asChild variant="outline" className="rounded-full">
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
        </CardContent>
      </Card>
    </div>
  )
}
