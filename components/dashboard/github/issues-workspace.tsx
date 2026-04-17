'use client'

import {
  CircleDot,
  FolderGit2,
  LayoutGrid,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { SectionHeader } from '@/components/dashboard/section-header'
import { Button } from '@/components/ui/button'
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
  const [trackedSearchValue, setTrackedSearchValue] = useState('')

  const repositories = data?.repositories ?? []
  const preferences = data?.preferences ?? {
    defaultRepository: null,
    selectedRepositories: [],
  }
  const allTrackedRepositories = getTrackedRepositories(
    repositories,
    preferences.selectedRepositories
  )
  const availableRepositories = repositories.filter(
    (repository) =>
      !preferences.selectedRepositories.includes(repository.full_name) &&
      repositoryMatchesSearch(repository, searchValue)
  )
  const trackedRepositories = allTrackedRepositories.filter((repository) =>
    repositoryMatchesSearch(repository, trackedSearchValue)
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
    <div className="animate-in fade-in space-y-8 duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          eyebrow={isReposMode ? 'Workspace Control' : 'Issue Tracker'}
          title={isReposMode ? 'Manage Repositories' : 'Tracked Repositories'}
          description={
            isReposMode
              ? 'Select the projects you want available for quick access and tracking.'
              : 'Focus on the issues that matter from across your organization.'
          }
          className="pb-0"
        />
        <div className="group relative w-full md:max-w-xs">
          <Search className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 size-4 -translate-y-1/2 transition-colors" />
          <Input
            placeholder="Search tracked..."
            value={trackedSearchValue}
            onChange={(e) => setTrackedSearchValue(e.target.value)}
            className="bg-muted/30 focus-visible:bg-background focus-visible:ring-primary/20 h-10 rounded-2xl border-transparent pl-9 transition-all"
          />
        </div>
      </div>

      {error ? (
        <div className="bg-destructive/10 border-destructive/20 text-destructive animate-in zoom-in-95 rounded-2xl border p-4 text-sm">
          {error.message}
        </div>
      ) : null}

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="app-panel overflow-hidden border-none shadow-xl shadow-black/5 dark:shadow-none">
            {isLoading ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-24">
                <Spinner className="size-6" />
                <span className="animate-pulse text-sm font-medium">
                  Synchronizing workspace...
                </span>
              </div>
            ) : trackedRepositories.length > 0 ? (
              <div className="divide-border/40 divide-y">
                {trackedRepositories.map((repository) => {
                  const isDefault =
                    preferences.defaultRepository === repository.full_name
                  return (
                    <div
                      key={repository.id}
                      className="group hover:bg-muted/30 relative flex items-center justify-between p-5 transition-all duration-300"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-2">
                            <span className="hover:text-primary cursor-default truncate text-sm font-semibold transition-colors">
                              {repository.name}
                            </span>
                            {isDefault && (
                              <Star className="text-primary size-3.5 fill-current" />
                            )}
                            {repository.private && (
                              <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                                Private
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground max-w-[280px] truncate text-xs">
                            {repository.description ||
                              'No description provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-muted-foreground/60 hidden items-center gap-4 sm:flex">
                          <div className="flex items-center gap-1.5">
                            <Star className="size-3.5" />
                            <span className="text-xs font-medium">
                              {repository.stargazers_count}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CircleDot className="size-3.5" />
                            <span className="text-xs font-medium">
                              {repository.open_issues_count}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            asChild
                            className="h-8 rounded-lg px-3 font-medium shadow-sm transition-all hover:shadow-md active:scale-95"
                          >
                            <Link
                              href={`/repos/${repository.owner.login}/${repository.name}`}
                            >
                              View
                            </Link>
                          </Button>
                          <div className="pointer-events-none flex items-center opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
                            {!isDefault && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleSetDefaultRepository(
                                    repository.full_name
                                  )
                                }
                                className="hover:text-primary hover:bg-primary/10 size-8 rounded-lg transition-colors"
                              >
                                <Star className="size-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleRemoveTrackedRepository(
                                  repository.full_name
                                )
                              }
                              className="hover:text-destructive hover:bg-destructive/10 size-8 rounded-lg transition-colors"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
                <div className="bg-muted/30 ring-border/50 mb-4 flex size-16 items-center justify-center rounded-3xl ring-1">
                  <FolderGit2 className="text-muted-foreground/40 size-8" />
                </div>
                <h3 className="text-lg font-semibold">Empty Workspace</h3>
                <p className="text-muted-foreground mt-1 max-w-xs text-sm">
                  {trackedSearchValue
                    ? `No repositories matching "${trackedSearchValue}" were found in your tracked list.`
                    : 'Start tracking repositories from the sidebar to manage their issues here.'}
                </p>
                {trackedSearchValue && (
                  <Button
                    variant="link"
                    onClick={() => setTrackedSearchValue('')}
                    className="text-primary mt-2 text-xs"
                  >
                    Clear search filter
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-8">
          <div className="glass-panel flex flex-col space-y-5 border-none p-6 shadow-xl shadow-black/5 dark:shadow-none">
            <div className="space-y-1">
              <h3 className="text-lg font-bold tracking-tight">
                Control Panel
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Add new repositories to your workspace to sync issues and
                automate summaries.
              </p>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPickerOpen(!isPickerOpen)}
                className="bg-muted/40 hover:border-primary/30 group flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-transparent px-4 text-sm transition-all"
              >
                <span className="flex-1 truncate text-left font-medium">
                  {selectedRepository?.name ?? 'Find a repository...'}
                </span>
                <Search className="text-muted-foreground group-hover:text-primary size-4 transition-colors" />
              </button>

              {isPickerOpen && (
                <div className="glass-panel animate-in fade-in slide-in-from-top-2 absolute top-full right-0 left-0 z-50 mt-2 p-2 shadow-2xl">
                  <Input
                    autoFocus
                    placeholder="Search available..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="mb-2 h-9 rounded-lg"
                  />
                  <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                    {availableRepositories.length > 0 ? (
                      availableRepositories.map((repo) => (
                        <button
                          key={repo.id}
                          onClick={() => {
                            setSelectedRepositoryName(repo.full_name)
                            setIsPickerOpen(false)
                          }}
                          className="hover:bg-primary/5 hover:text-primary group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all"
                        >
                          <span className="truncate font-medium">
                            {repo.full_name}
                          </span>
                          {repo.private && (
                            <CircleDot className="text-muted-foreground/40 group-hover:text-primary/40 size-3" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="text-muted-foreground py-6 text-center text-xs">
                        No available repositories found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedRepository && (
              <div className="app-panel bg-muted/30 animate-in zoom-in-95 rounded-2xl border-none p-4 duration-300">
                <div className="mb-3 space-y-1">
                  <p className="text-primary text-[10px] leading-none font-bold tracking-widest uppercase">
                    {selectedRepository.owner.login}
                  </p>
                  <h4 className="truncate text-sm leading-none font-bold">
                    {selectedRepository.name}
                  </h4>
                </div>
                {selectedRepository.description && (
                  <p className="text-muted-foreground mb-4 line-clamp-3 text-xs leading-relaxed">
                    {selectedRepository.description}
                  </p>
                )}
                <div className="text-muted-foreground/60 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="size-3" />
                    <span className="text-[10px] font-bold tracking-tighter uppercase">
                      {selectedRepository.stargazers_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CircleDot className="size-3" />
                    <span className="text-[10px] font-bold tracking-tighter uppercase">
                      {selectedRepository.open_issues_count}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button
              className="shadow-primary/10 hover:shadow-primary/20 h-11 w-full rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
              onClick={handleAddTrackedRepository}
              disabled={!selectedRepository || updatePreferences.isPending}
            >
              {updatePreferences.isPending &&
              pendingRepositoryAction ===
                `add:${selectedRepository?.full_name}` ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Synchronizing...
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  Track Workspace
                </>
              )}
            </Button>
          </div>

          <div className="border-primary/10 from-primary/5 rounded-3xl border bg-gradient-to-br to-transparent p-5">
            <h4 className="text-primary mb-2 flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
              <LayoutGrid className="size-3" />
              Pro Tip
            </h4>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Designate a <strong>Default</strong> project to make it your
              primary target for automated updates and issue filtering.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
