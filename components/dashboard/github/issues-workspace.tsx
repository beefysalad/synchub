'use client'

import {
  FolderGit2,
  Plus,
  Search,
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
    <div className="animate-in fade-in space-y-8 duration-500">
      <SectionHeader
        eyebrow={isReposMode ? 'Repository Control' : 'GitHub Issue Management'}
        title={isReposMode ? 'Repository workspace' : 'Tracked repositories'}
        description={
          isReposMode
            ? 'Choose which repositories stay in view, pick a default home base, and jump straight into the work that matters.'
            : 'Search GitHub, add the repos you actually work in, and jump into their active issues.'
        }
      />

      {error ? (
        <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-2xl border px-5 py-4 text-sm transition-all duration-300">
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

      <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="relative overflow-visible transition-all duration-300">
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
                  className="border-border bg-background hover:border-primary/50 flex h-14 w-full items-center justify-between rounded-2xl border px-4 text-left text-sm shadow-sm transition-all duration-300"
                >
                  <span className="truncate">
                    {selectedRepository?.full_name ??
                      'Search and select a repository'}
                  </span>
                  <Search className="text-muted-foreground size-4 shrink-0 transition-all duration-300" />
                </button>

                {isPickerOpen ? (
                  <div className="glass-panel animate-in fade-in slide-in-from-top-2 mt-3 p-3 shadow-lg transition-all duration-300">
                    <Input
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder="Search by owner, repo, or description"
                      className="rounded-2xl transition-all duration-300"
                    />
                    <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                      {isLoading ? (
                        <div className="text-muted-foreground border-border flex items-center gap-2 rounded-2xl border border-dashed px-4 py-5 text-sm transition-all duration-300">
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
                            className="border-border hover:border-primary/40 hover:bg-primary/5 w-full rounded-2xl border px-4 py-3 text-left transition-all duration-300"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium transition-all duration-300">
                                {repository.full_name}
                              </p>
                              <span className="border-primary/20 bg-primary/5 text-primary rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase transition-all duration-300">
                                {repository.private ? 'Private' : 'Public'}
                              </span>
                            </div>
                            {repository.description ? (
                              <p className="text-muted-foreground mt-1 text-xs transition-all duration-300">
                                {repository.description}
                              </p>
                            ) : null}
                          </button>
                        ))
                      ) : (
                        <div className="text-muted-foreground border-border rounded-2xl border border-dashed px-4 py-5 text-sm transition-all duration-300">
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
                className="h-14 rounded-2xl px-6 shadow-sm transition-all duration-300"
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
              <div className="glass-surface rounded-3xl px-5 py-5 transition-all duration-300">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-all duration-300">
                    Ready to track
                  </span>
                  <span className="border-border text-muted-foreground rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-all duration-300">
                    Owner: {selectedRepository.owner.login}
                  </span>
                </div>
                <p className="text-foreground mt-3 font-semibold transition-all duration-300">
                  {selectedRepository.full_name}
                </p>
                <p className="text-muted-foreground/80 mt-1 text-sm leading-relaxed transition-all duration-300">
                  {selectedRepository.description ??
                    'No repository description available.'}
                </p>
              </div>
            ) : (
              <div className="text-muted-foreground border-border rounded-3xl border border-dashed px-5 py-5 text-sm transition-all duration-300">
                Pick a repository to preview it here before adding it to your
                tracked workspace.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight transition-all duration-300">
              {isReposMode
                ? 'Your repository collection'
                : 'Tracked repositories'}
            </h2>
            <p className="text-muted-foreground/80 mt-1 text-sm transition-all duration-300">
              {isReposMode
                ? 'Each card is a launch point into that repository’s workspace, settings, and default-state controls.'
                : 'Open a repo workspace to browse issues or create a new one.'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground border-border rounded-3xl border border-dashed px-5 py-8 text-sm transition-all duration-300">
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
                  className="transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none"
                >
                  <CardHeader className="space-y-4">
                    <CardAction>
                      <div className="border-primary/20 bg-primary/5 text-primary rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-all duration-300">
                        {repository.private ? 'Private' : 'Public'}
                      </div>
                    </CardAction>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl font-bold transition-all duration-300">
                          {repository.full_name}
                        </CardTitle>
                        <CardDescription className="mt-2 line-clamp-2 leading-relaxed transition-all duration-300">
                          {repository.description ??
                            'This repository is now available in your SyncHub issue flow.'}
                        </CardDescription>
                      </div>
                      {isDefault ? (
                        <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-all duration-300">
                          Default
                        </span>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-muted-foreground border-border rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-all duration-300">
                        Owner: {repository.owner.login}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        asChild
                        className="rounded-full px-6 shadow-sm transition-all duration-300"
                      >
                        <Link
                          href={`/repos/${repository.owner.login}/${repository.name}`}
                        >
                          Open repo
                        </Link>
                      </Button>

                      {isDefault ? (
                        <span className="border-primary/20 bg-primary/5 text-primary rounded-full border px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all duration-300">
                          Default
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full px-5 transition-all duration-300"
                          onClick={() =>
                            handleSetDefaultRepository(repository.full_name)
                          }
                          disabled={updatePreferences.isPending}
                        >
                          {updatePreferences.isPending &&
                          pendingRepositoryAction ===
                            `default:${repository.full_name}` ? (
                            <>
                              <Spinner />
                              Saving...
                            </>
                          ) : (
                            'Set default'
                          )}
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full px-4 transition-all duration-300"
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
          <div className="text-muted-foreground border-border rounded-3xl border border-dashed px-5 py-8 text-sm transition-all duration-300">
            No tracked repositories yet. Add one above to start managing its
            issues from SyncHub.
          </div>
        )}
      </div>
    </div>
  )
}
