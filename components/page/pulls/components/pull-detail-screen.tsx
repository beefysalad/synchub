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
  const [selectedIssueNumbers, setSelectedIssueNumbers] = useState<number[]>(
    []
  )

  const pull = data?.pull
  const comments = data?.comments ?? []
  const detectedIssueReferences = data?.detectedIssueReferences ?? []
  const likelyLinkedIssue = data?.likelyLinkedIssue ?? null
  const availableIssues =
    issuesData?.issues.filter((issue) => issue.number !== pullNumber) ?? []
  const likelyLinkedIssueDetails = likelyLinkedIssue
    ? availableIssues.find((issue) => issue.number === likelyLinkedIssue.number)
    : null
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

      <div className="grid gap-6 2xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pull request overview</CardTitle>
            <CardDescription>
              Quick context before you open the full review flow in GitHub.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="glass-surface rounded-3xl px-4 py-4 transition-all duration-300">
              <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                Status
              </p>
              <p className="mt-2 text-2xl font-semibold capitalize">
                {pull.state}
              </p>
            </div>
            <div className="glass-surface rounded-3xl px-4 py-4 transition-all duration-300">
              <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                Author
              </p>
              <p className="mt-2 text-lg font-semibold">{pull.user.login}</p>
            </div>
            <div className="glass-surface rounded-3xl px-4 py-4 transition-all duration-300">
              <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                Discussion
              </p>
              <p className="mt-2 text-lg font-semibold">
                {comments.length + 1} entries
              </p>
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
                Detected references
              </p>
              {detectedIssueReferences.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {detectedIssueReferences.map((reference) => (
                    <span
                      key={`${reference.fullName}#${reference.number}`}
                      className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
                    >
                      {reference.repo.toUpperCase()} #{reference.number}
                    </span>
                  ))}
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
                Pick one or more open issues from this repo to add native
                GitHub closing references to the PR description.
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitPullRequest className="size-5 text-sky-600 dark:text-sky-300" />
              Pull request details
            </CardTitle>
            <CardDescription>
              Update the PR title and description here, then review the
              discussion below.
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
      </div>
    </div>
  )
}
