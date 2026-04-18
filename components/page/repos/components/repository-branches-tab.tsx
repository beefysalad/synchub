'use client'

import {
  ExternalLink,
  GitBranch,
  GitPullRequest,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useGithubBranches } from '@/hooks/use-github-branches'
import {
  useCreateGithubPull,
  useGithubPullTemplate,
} from '@/hooks/use-github-pulls'

export function RepositoryBranchesTab({
  owner,
  repo,
}: {
  owner: string
  repo: string
}) {
  const { data, isLoading } = useGithubBranches({ owner, repo })
  const { data: pullTemplateData } = useGithubPullTemplate(owner, repo)
  const createPull = useCreateGithubPull()
  const branches = useMemo(() => data?.branches ?? [], [data?.branches])
  const [selectedHead, setSelectedHead] = useState('')
  const [selectedBase, setSelectedBase] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [hasEditedBody, setHasEditedBody] = useState(false)
  const [draft, setDraft] = useState(false)

  const defaultBaseBranch = useMemo(
    () =>
      data?.defaultBranch ??
      branches.find((branch) => branch.protected)?.name ??
      branches.find((branch) => branch.name === 'main')?.name ??
      branches.find((branch) => branch.name === 'master')?.name ??
      branches[0]?.name ??
      '',
    [data?.defaultBranch, branches]
  )

  const availableHeadBranches = useMemo(
    () => branches.filter((branch) => branch.name !== (selectedBase || defaultBaseBranch)),
    [branches, selectedBase, defaultBaseBranch]
  )

  const resolvedBase = selectedBase || defaultBaseBranch
  const pullTemplate = pullTemplateData?.template ?? ''
  const resolvedBody = hasEditedBody ? body : body || pullTemplate

  async function handleCreatePull() {
    const head = selectedHead.trim()
    const base = resolvedBase.trim()
    const description = resolvedBody.trim()

    if (!head || !base || !title.trim()) {
      toast.error('Select head/base branches and add a pull request title.')
      return
    }

    if (head === base) {
      toast.error('Head and base branches must be different to create a pull request.')
      return
    }

    try {
      const response = await createPull.mutateAsync({
        owner,
        repo,
        title: title.trim(),
        body: description || undefined,
        head,
        base,
        draft,
      })

      toast.success(`Pull request #${response.pull.number} created successfully.`)
      setTitle('')
      setBody('')
      setHasEditedBody(false)
      setSelectedHead('')
      setDraft(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to create pull request'
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <div className="border-b border-border bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <GitBranch className="size-4" />
              Repository branches
            </h3>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="flex justify-center p-8 text-center text-sm text-muted-foreground">
                <Spinner className="size-5 text-muted-foreground/30" />
              </div>
            ) : branches.length ? (
              branches.map((branch) => (
                <div
                  key={branch.name}
                  className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {branch.name}
                      </p>
                      {branch.protected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <ShieldCheck className="size-3" />
                          Protected
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {branch.sha.slice(0, 7)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={branch.name === defaultBaseBranch}
                      onClick={() => {
                        setSelectedHead(branch.name)
                        setSelectedBase(defaultBaseBranch)
                        if (!title.trim()) {
                          setTitle(branch.name.replaceAll('-', ' '))
                        }
                      }}
                    >
                      <GitPullRequest className="size-4" />
                      Create PR
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      asChild
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Link href={branch.htmlUrl} target="_blank">
                        <ExternalLink className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No branches found in this repository.
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <div className="border-b border-border bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <GitPullRequest className="size-4" />
              Create pull request
            </h3>
          </div>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Head branch
              </label>
              <select
                value={selectedHead}
                onChange={(event) => setSelectedHead(event.target.value)}
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm outline-none"
              >
                <option value="">Select branch</option>
                {availableHeadBranches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Base branch
              </label>
              <select
                value={resolvedBase}
                onChange={(event) => setSelectedBase(event.target.value)}
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm outline-none"
              >
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Title
              </label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Summarize the pull request"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Description
              </label>
              <textarea
                value={resolvedBody}
                onChange={(event) => {
                  setHasEditedBody(true)
                  setBody(event.target.value)
                }}
                rows={8}
                placeholder="Add context, testing notes, or linked issue references..."
                className="border-input bg-background min-h-[160px] w-full rounded-md border px-3 py-2 text-sm outline-none"
              />
              {pullTemplateData?.path ? (
                <p className="text-xs text-muted-foreground">
                  Loaded from GitHub template: <span className="font-mono">{pullTemplateData.path}</span>
                </p>
              ) : null}
            </div>

            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={draft}
                onChange={(event) => setDraft(event.target.checked)}
                className="size-4 rounded border-input"
              />
              Create as draft
            </label>

            <Button
              type="button"
              className="w-full rounded-full"
              disabled={
                createPull.isPending ||
                !branches.length ||
                !selectedHead ||
                !resolvedBase ||
                selectedHead === resolvedBase
              }
              onClick={handleCreatePull}
            >
              {createPull.isPending ? (
                <>
                  <Spinner />
                  Creating pull request...
                </>
              ) : (
                <>
                  <GitPullRequest className="size-4" />
                  Create pull request
                </>
              )}
            </Button>

            {selectedHead && resolvedBase ? (
              <p className="text-xs text-muted-foreground">
                This will open a PR from{' '}
                <span className="font-mono text-foreground">{selectedHead}</span>{' '}
                into{' '}
                <span className="font-mono text-foreground">{resolvedBase}</span>.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Choose a branch to open a pull request directly from SyncHub.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
