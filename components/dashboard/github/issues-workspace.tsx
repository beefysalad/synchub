'use client'

import {
  ArrowRight,
  FolderGit2,
  Plus,
  Search,
  Settings2,
  Star,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { SectionHeader } from '@/components/dashboard/section-header'
import { StatusCard } from '@/components/dashboard/status-card'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  useGithubRepositories,
  useUpdateGithubPreferences,
} from '@/hooks/use-github-repositories'
import type { GitHubRepository } from '@/lib/github/types'

function repositoryMatchesSearch(repository: GitHubRepository, query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return [repository.full_name, repository.description ?? ''].some((value) =>
    value.toLowerCase().includes(normalizedQuery)
  )
}

function getTrackedRepositories(
  repositories: GitHubRepository[],
  trackedRepositoryNames: string[]
) {
  const repositoryMap = new Map(
    repositories.map((repository) => [repository.full_name, repository])
  )

  return trackedRepositoryNames
    .map((repositoryName) => repositoryMap.get(repositoryName))
    .filter((repository): repository is GitHubRepository => Boolean(repository))
}

export function IssuesWorkspace({
  mode = 'issues',
}: {
  mode?: 'issues' | 'repos'
}) {
  const { data, isLoading, error } = useGithubRepositories()
  const updatePreferences = useUpdateGithubPreferences()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [selectedRepositoryName, setSelectedRepositoryName] = useState('')
  const [pendingRepositoryAction, setPendingRepositoryAction] = useState<
    string | null
  >(null)

  const repositories = data?.repositories ?? []
  const preferences = data?.preferences ?? {
    defaultRepository: null,
    selectedRepositories: [],
  }
  const trackedRepositories = getTrackedRepositories(
    repositories,
    preferences.selectedRepositories
  )
  const availableRepositories = repositories.filter(
    (repository) =>
      !preferences.selectedRepositories.includes(repository.full_name) &&
      repositoryMatchesSearch(repository, searchValue)
  )
  const selectedRepository =
    repositories.find(
      (repository) => repository.full_name === selectedRepositoryName
    ) ?? null
  const defaultRepository =
    trackedRepositories.find(
      (repository) => repository.full_name === preferences.defaultRepository
    ) ??
    trackedRepositories[0] ??
    null
  const isReposMode = mode === 'repos'

  function mutateTrackedRepositories({
    selectedRepositories,
    defaultRepository,
    successMessage,
    actionKey,
    onSuccess,
  }: {
    selectedRepositories: string[]
    defaultRepository: string | null
    successMessage: string
    actionKey: string
    onSuccess?: () => void
  }) {
    setPendingRepositoryAction(actionKey)

    updatePreferences.mutate(
      {
        selectedRepositories,
        defaultRepository,
      },
      {
        onSuccess: () => {
          toast.success(successMessage)
          onSuccess?.()
          setPendingRepositoryAction(null)
        },
        onError: (mutationError) => {
          toast.error(mutationError.message)
          setPendingRepositoryAction(null)
        },
      }
    )
  }

  function handleAddTrackedRepository() {
    if (!selectedRepository) {
      return
    }

    mutateTrackedRepositories({
      selectedRepositories: Array.from(
        new Set([
          ...preferences.selectedRepositories,
          selectedRepository.full_name,
        ])
      ),
      defaultRepository:
        preferences.defaultRepository ?? selectedRepository.full_name,
      successMessage: `${selectedRepository.full_name} is now being tracked.`,
      actionKey: `add:${selectedRepository.full_name}`,
      onSuccess: () => {
        setSelectedRepositoryName('')
        setSearchValue('')
        setIsPickerOpen(false)
      },
    })
  }

  function handleRemoveTrackedRepository(repositoryFullName: string) {
    const nextSelectedRepositories = preferences.selectedRepositories.filter(
      (trackedRepository) => trackedRepository !== repositoryFullName
    )
    const nextDefaultRepository =
      preferences.defaultRepository === repositoryFullName
        ? (nextSelectedRepositories[0] ?? null)
        : preferences.defaultRepository

    mutateTrackedRepositories({
      selectedRepositories: nextSelectedRepositories,
      defaultRepository: nextDefaultRepository,
      successMessage: `${repositoryFullName} was removed from tracked repositories.`,
      actionKey: `remove:${repositoryFullName}`,
    })
  }

  function handleSetDefaultRepository(repositoryFullName: string) {
    mutateTrackedRepositories({
      selectedRepositories: preferences.selectedRepositories,
      defaultRepository: repositoryFullName,
      successMessage: `${repositoryFullName} is now the default repository.`,
      actionKey: `default:${repositoryFullName}`,
    })
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow={isReposMode ? 'Repository Control' : 'GitHub Issue Management'}
        title={isReposMode ? 'Repository workspace' : 'Tracked repositories'}
        description={
          isReposMode
            ? 'Choose the repositories SyncHub should watch, set a default home base, and jump into repo-specific settings or issue workspaces.'
            : 'Search GitHub repositories, add the ones you want SyncHub to track, and jump into their active issues.'
        }
        actions={
          isReposMode ? (
            <Button asChild className="rounded-full">
              <Link href="/issues">
                Open issue workspace
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : undefined
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
          label="Accessible repos"
          value={String(repositories.length)}
          detail="Repositories currently available from your GitHub authorization."
        />
        <StatusCard
          icon={Star}
          label="Tracked repos"
          value={String(trackedRepositories.length)}
          detail="Repositories that now appear in your SyncHub issue workspace."
        />
        <StatusCard
          icon={Plus}
          label="Available to add"
          value={String(
            repositories.length - preferences.selectedRepositories.length
          )}
          detail="Accessible repositories that are not being tracked yet."
        />
        <StatusCard
          icon={Search}
          label="Default repo"
          value={preferences.defaultRepository ?? 'None'}
          detail="Used when future actions need a fallback repository."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="relative z-0 overflow-visible border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle>Add a repository to track</CardTitle>
            <CardDescription>
              Search across your accessible GitHub repositories, then pin the
              ones that deserve a permanent place in SyncHub.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setIsPickerOpen((currentValue) => !currentValue)
                  }
                  className="flex h-14 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm shadow-sm transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-950"
                >
                  <span className="truncate">
                    {selectedRepository?.full_name ??
                      'Search and select a repository'}
                  </span>
                  <Search className="text-muted-foreground size-4" />
                </button>

                {isPickerOpen ? (
                  <div className="absolute inset-x-0 top-[calc(100%+0.75rem)] z-30 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                    <Input
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder="Search by owner, repo, or description"
                      className="rounded-2xl"
                    />
                    <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                      {isLoading ? (
                        <div className="text-muted-foreground flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-sm dark:border-slate-700">
                          <Spinner className="size-4" />
                          Loading repositories...
                        </div>
                      ) : availableRepositories.length ? (
                        availableRepositories.map((repository) => (
                          <button
                            key={repository.id}
                            type="button"
                            onClick={() => {
                              setSelectedRepositoryName(repository.full_name)
                              setIsPickerOpen(false)
                            }}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-800 dark:hover:bg-slate-900"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium">
                                {repository.full_name}
                              </p>
                              <span className="text-muted-foreground rounded-full border border-slate-200 px-2.5 py-1 text-[11px] dark:border-slate-700">
                                {repository.private ? 'Private' : 'Public'}
                              </span>
                            </div>
                            {repository.description ? (
                              <p className="text-muted-foreground mt-1 text-xs">
                                {repository.description}
                              </p>
                            ) : null}
                          </button>
                        ))
                      ) : (
                        <div className="text-muted-foreground rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-sm dark:border-slate-700">
                          No matching repositories found.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <Button
                type="button"
                onClick={handleAddTrackedRepository}
                disabled={
                  !selectedRepository ||
                  updatePreferences.isPending ||
                  isLoading
                }
                className="h-14 rounded-2xl px-6"
              >
                {updatePreferences.isPending &&
                pendingRepositoryAction ===
                  `add:${selectedRepository?.full_name}` ? (
                  <>
                    <Spinner />
                    Adding repo...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Track repo
                  </>
                )}
              </Button>
            </div>

            {selectedRepository ? (
              <div className="rounded-3xl border border-emerald-200 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(255,255,255,0.8))] px-5 py-5 dark:border-emerald-500/20 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(2,6,23,0.7))]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100">
                    Ready to track
                  </span>
                  <span className="rounded-full border border-emerald-200 px-3 py-1 text-xs text-emerald-900/80 dark:border-emerald-500/20 dark:text-emerald-100/80">
                    Owner: {selectedRepository.owner.login}
                  </span>
                </div>
                <p className="mt-3 font-medium text-emerald-950 dark:text-emerald-100">
                  {selectedRepository.full_name}
                </p>
                <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-100/80">
                  {selectedRepository.description ??
                    'No repository description available.'}
                </p>
              </div>
            ) : (
              <div className="text-muted-foreground rounded-3xl border border-dashed border-slate-300 px-5 py-5 text-sm dark:border-slate-700">
                Pick a repository to preview it here before adding it to your
                tracked workspace.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle>Workspace snapshot</CardTitle>
            <CardDescription>
              Keep one repository as your home base, then branch into issues or
              settings from there.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {defaultRepository ? (
              <div className="rounded-3xl border border-slate-200/70 bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(15,118,110,0.85))] px-5 py-5 text-white shadow-xl dark:border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                      Default repository
                    </div>
                    <p className="mt-4 text-2xl font-semibold">
                      {defaultRepository.full_name}
                    </p>
                    <p className="mt-2 text-sm text-white/75">
                      {defaultRepository.description ??
                        'This repository is currently the main workspace SyncHub falls back to.'}
                    </p>
                  </div>
                  <Star className="size-5 text-emerald-200" />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    asChild
                    variant="secondary"
                    className="rounded-full bg-white text-slate-950 hover:bg-white/90"
                  >
                    <Link
                      href={`/repos/${defaultRepository.owner.login}/${defaultRepository.name}`}
                    >
                      Open repo
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link
                      href={`/repos/${defaultRepository.owner.login}/${defaultRepository.name}/settings`}
                    >
                      <Settings2 className="size-4" />
                      Repo settings
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm dark:border-slate-700">
                Set a default repository to give your repo workspace a clear
                home base for triage and notifications.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                  Tracking
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {trackedRepositories.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                  Available
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {Math.max(
                    repositories.length -
                      preferences.selectedRepositories.length,
                    0
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                  Default
                </p>
                <p className="mt-2 truncate text-sm font-semibold">
                  {preferences.defaultRepository ?? 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {isReposMode
                ? 'Your repository collection'
                : 'Tracked repositories'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isReposMode
                ? 'Each card is a launch point into that repository’s workspace, settings, and default-state controls.'
                : 'Open a repo workspace to browse issues or create a new one.'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm dark:border-slate-700">
            Loading your tracked repositories...
          </div>
        ) : trackedRepositories.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {trackedRepositories.map((repository) => {
              const isDefault =
                preferences.defaultRepository === repository.full_name

              return (
                <Card
                  key={repository.id}
                  className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none"
                >
                  <CardHeader className="space-y-4">
                    <CardAction>
                      <div className="text-muted-foreground rounded-full border border-slate-200/70 px-3 py-1 text-[11px] dark:border-slate-800">
                        {repository.private ? 'Private' : 'Public'}
                      </div>
                    </CardAction>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl">
                          {repository.full_name}
                        </CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                          {repository.description ??
                            'This repository is now available in your SyncHub issue flow.'}
                        </CardDescription>
                      </div>
                      {isDefault ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100">
                          Default
                        </span>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-muted-foreground rounded-full border border-slate-200 px-3 py-1 text-xs dark:border-slate-800">
                        Owner: {repository.owner.login}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button asChild className="rounded-full">
                        <Link
                          href={`/repos/${repository.owner.login}/${repository.name}`}
                        >
                          Open repo
                        </Link>
                      </Button>

                      {isReposMode ? (
                        <Button
                          asChild
                          variant="outline"
                          className="rounded-full"
                        >
                          <Link
                            href={`/repos/${repository.owner.login}/${repository.name}/settings`}
                          >
                            <Settings2 className="size-4" />
                            Settings
                          </Link>
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() =>
                          handleSetDefaultRepository(repository.full_name)
                        }
                        disabled={isDefault || updatePreferences.isPending}
                      >
                        {updatePreferences.isPending &&
                        pendingRepositoryAction ===
                          `default:${repository.full_name}` ? (
                          <>
                            <Spinner />
                            Saving...
                          </>
                        ) : isDefault ? (
                          'Default repo'
                        ) : (
                          'Set default'
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() =>
                          handleRemoveTrackedRepository(repository.full_name)
                        }
                        disabled={updatePreferences.isPending}
                      >
                        {updatePreferences.isPending &&
                        pendingRepositoryAction ===
                          `remove:${repository.full_name}` ? (
                          <>
                            <Spinner />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="size-4" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-muted-foreground rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm dark:border-slate-700">
            No tracked repositories yet. Add one above to start managing its
            issues from SyncHub.
          </div>
        )}
      </div>
    </div>
  )
}
