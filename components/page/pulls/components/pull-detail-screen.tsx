'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FilePenLine,
  GitPullRequest,
  Link2,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { EditGitHubThreadForm } from '@/components/shared/edit-github-thread-form'
import { SectionHeader } from '@/components/shared/section-header'
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
  useEditGithubPull,
  useGithubPullDetail,
  useLinkGithubPullIssue,
} from '@/hooks/use-github-pulls'

function ConversationEntry({
  avatarUrl,
  body,
  createdAt,
  username,
}: {
  avatarUrl?: string
  body: string
  createdAt: string
  username: string
}) {
  return (
    <div className="flex gap-4">
      <Image
        src={avatarUrl ?? `https://github.com/${username}.png`}
        alt={username}
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800"
      />
      <div className="glass-panel border-border/50 min-w-0 flex-1 shadow-sm transition-all duration-300">
        <div className="glass-surface border-border/40 rounded-t-3xl border-b px-5 py-3 text-sm transition-all duration-300">
          <span className="font-semibold">{username}</span> commented{' '}
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </div>
        <div className="prose prose-slate prose-sm dark:prose-invert max-w-none px-5 py-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {body || '*No description provided.*'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export function PullDetailPage({
  owner,
  repo,
  pullNumber,
}: {
  owner: string
  repo: string
  pullNumber: number
}) {
  const [isEditing, setIsEditing] = useState(false)
  const { data, isLoading, error } = useGithubPullDetail(
    owner,
    repo,
    pullNumber
  )
  const { data: issuesData } = useGithubIssues({
    owner,
    repo,
    state: 'open',
  })
  const linkPullIssue = useLinkGithubPullIssue(owner, repo, pullNumber)
  const editPull = useEditGithubPull(owner, repo, pullNumber)
  const [selectedIssueNumbers, setSelectedIssueNumbers] = useState<number[]>([])

  const pull = data?.pull
  const comments = data?.comments ?? []
  const detectedIssueReferences = data?.detectedIssueReferences ?? []
  const likelyLinkedIssue = data?.likelyLinkedIssue ?? null
  const availableIssues =
    issuesData?.issues.filter((issue) => issue.number !== pullNumber) ?? []
  const likelyLinkedIssueDetails = likelyLinkedIssue
    ? availableIssues.find((issue) => issue.number === likelyLinkedIssue.number)
    : null
  const linkedIssues = detectedIssueReferences.map((reference) => {
    const matchingIssue =
      reference.owner === owner && reference.repo === repo
        ? availableIssues.find((issue) => issue.number === reference.number)
        : null

    return {
      ...reference,
      title: matchingIssue?.title ?? null,
      internalHref:
        reference.owner === owner && reference.repo === repo
          ? `/issues/${owner}/${repo}/${reference.number}`
          : null,
      externalHref: `https://github.com/${reference.owner}/${reference.repo}/issues/${reference.number}`,
    }
  })
  const selectedIssues = availableIssues.filter((issue) =>
    selectedIssueNumbers.includes(issue.number)
  )

  function toggleSelectedIssue(issueNumber: number) {
    setSelectedIssueNumbers((current) =>
      current.includes(issueNumber)
        ? current.filter((value) => value !== issueNumber)
        : [...current, issueNumber]
    )
  }

  function addSelectedIssue(issueNumber: number) {
    setSelectedIssueNumbers((current) =>
      current.includes(issueNumber) ? current : [...current, issueNumber]
    )
  }

  function handleManualLink() {
    if (!selectedIssueNumbers.length) {
      toast.error('Select at least one issue to link first.')
      return
    }

    linkPullIssue.mutate(selectedIssueNumbers, {
      onSuccess: () => {
        setSelectedIssueNumbers([])
        toast.success(
          `Pull request #${pullNumber} linked to ${selectedIssueNumbers.length} issue${selectedIssueNumbers.length === 1 ? '' : 's'}.`
        )
      },
      onError: (mutationError) => {
        toast.error(mutationError.message)
      },
    })
  }

  async function handleEditSubmit(values: { title: string; body: string }) {
    try {
      await editPull.mutateAsync(values)
      toast.success(`Pull request #${pullNumber} updated successfully.`)
      setIsEditing(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update pull request'
      )
    }
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] flex-col items-center justify-center gap-4 text-sm">
        <Spinner className="size-8" />
        Loading pull request details...
      </div>
    )
  }

  if (error || !pull) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
        {error?.message ?? 'Pull Request not found.'}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow={`${owner}/${repo} • Pull Request #${pull.number}`}
        title={pull.title}
        description={`Opened by ${pull.user.login} ${formatDistanceToNow(
          new Date(pull.created_at),
          { addSuffix: true }
        )} • ${comments.length} comments`}
        actions={
          <>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/repos/${owner}/${repo}`}>
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href={pull.html_url} target="_blank">
                <ExternalLink className="size-4" />
                View on GitHub
              </Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setIsEditing((current) => !current)}
              disabled={editPull.isPending}
            >
              {editPull.isPending ? (
                <Spinner />
              ) : (
                <FilePenLine className="size-4" />
              )}
              {isEditing ? 'Stop editing' : 'Edit details'}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitPullRequest className="size-5 text-sky-600 dark:text-sky-300" />
              Pull request details
            </CardTitle>
            <CardDescription>
              Review the PR description and discussion first, then use the side
              panel for linked issue controls and quick context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <EditGitHubThreadForm
                initialTitle={pull.title}
                initialBody={pull.body ?? ''}
                isPending={editPull.isPending}
                onCancel={() => setIsEditing(false)}
                onSubmit={handleEditSubmit}
              />
            ) : (
              <ConversationEntry
                avatarUrl={pull.user.avatar_url}
                body={pull.body ?? '*No description provided.*'}
                createdAt={pull.created_at}
                username={pull.user.login}
              />
            )}

            {comments.map((comment) => (
              <ConversationEntry
                key={comment.id}
                avatarUrl={comment.user.avatar_url}
                body={comment.body}
                createdAt={comment.created_at}
                username={comment.user.login}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Quick context and issue linking without blocking the PR content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 capitalize dark:text-sky-300">
                {pull.state}
              </span>
              <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-semibold">
                {pull.user.login}
              </span>
              <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-semibold">
                {comments.length + 1} entries
              </span>
            </div>

            <div className="glass-surface rounded-3xl px-4 py-4 transition-all duration-300">
              <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                Branch
              </p>
              <p className="mt-2 text-lg font-semibold">{pull.head.ref}</p>
            </div>

            <div className="glass-surface rounded-3xl px-4 py-4 transition-all duration-300">
              <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                Likely linked issue
              </p>
              {likelyLinkedIssue ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 text-sm dark:border-sky-500/20 dark:bg-sky-500/10">
                    <p className="font-semibold text-sky-950 dark:text-sky-100">
                      {likelyLinkedIssue.fullName} #{likelyLinkedIssue.number}
                    </p>
                    <p className="mt-1 text-sky-900/80 dark:text-sky-100/80">
                      {likelyLinkedIssueDetails?.title ??
                        `Detected from branch name \`${pull.head.ref}\`.`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => addSelectedIssue(likelyLinkedIssue.number)}
                  >
                    Add this issue to linker
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground mt-2 text-sm">
                  No likely issue was inferred from the branch name.
                </p>
              )}
            </div>

            <div className="glass-surface rounded-3xl px-4 py-4 transition-all duration-300">
              <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                Linked issues
              </p>
              {linkedIssues.length ? (
                <div className="mt-3 space-y-2">
                  {linkedIssues.map((reference) => {
                    const content = (
                      <div className="group flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-100/50 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/20">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="shrink-0 font-semibold text-emerald-950 dark:text-emerald-100">
                            {reference.fullName} #{reference.number}
                          </span>
                          <span className="truncate text-emerald-900/70 dark:text-emerald-100/70">
                            {reference.title ?? 'Linked from PR'}
                          </span>
                        </div>
                      </div>
                    )

                    return reference.internalHref ? (
                      <Link
                        key={`${reference.fullName}#${reference.number}`}
                        href={reference.internalHref}
                        className="block"
                      >
                        {content}
                      </Link>
                    ) : (
                      <Link
                        key={`${reference.fullName}#${reference.number}`}
                        href={reference.externalHref}
                        target="_blank"
                        className="block"
                      >
                        {content}
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground mt-2 text-sm">
                  No issue references detected in the PR title or description
                  yet.
                </p>
              )}
            </div>
            <div className="glass-surface rounded-3xl px-4 py-4 transition-all duration-300">
              <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                Link to issue
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                Pick one or more open issues from this repo to add native GitHub
                closing references to the PR description.
              </p>
              <div className="mt-4 space-y-4">
                {selectedIssues.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedIssues.map((issue) => (
                      <button
                        key={issue.number}
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition-all duration-300 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
                        onClick={() => toggleSelectedIssue(issue.number)}
                      >
                        <span>
                          #{issue.number} · {issue.title}
                        </span>
                        <X className="size-3.5" />
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {availableIssues.map((issue) => {
                    const isSelected = selectedIssueNumbers.includes(
                      issue.number
                    )

                    return (
                      <button
                        key={issue.number}
                        type="button"
                        className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
                          isSelected
                            ? 'border-primary/30 bg-primary/10'
                            : 'border-border bg-background hover:border-primary/30 hover:bg-primary/5'
                        }`}
                        onClick={() => toggleSelectedIssue(issue.number)}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">
                            #{issue.number} · {issue.title}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            Opened by {issue.user.login}
                          </p>
                        </div>
                        <div
                          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background'
                          }`}
                        >
                          {isSelected ? <Check className="size-3.5" /> : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={handleManualLink}
                  disabled={
                    linkPullIssue.isPending ||
                    !availableIssues.length ||
                    !selectedIssueNumbers.length
                  }
                >
                  {linkPullIssue.isPending ? (
                    <Spinner />
                  ) : (
                    <Link2 className="size-4" />
                  )}
                  Link selected issues natively
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
