'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  ExternalLink,
  FilePenLine,
  GitPullRequest,
  Link2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { EditGitHubThreadForm } from '@/components/dashboard/github/edit-github-thread-form'
import { SectionHeader } from '@/components/dashboard/section-header'
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
      <div className="min-w-0 flex-1 rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="rounded-t-3xl border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-sm dark:border-slate-800/50 dark:bg-slate-900/50">
          <span className="font-semibold">{username}</span> commented{' '}
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </div>
        <div className="prose prose-slate prose-sm max-w-none px-5 py-5 dark:prose-invert">
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
  const { data, isLoading, error } = useGithubPullDetail(owner, repo, pullNumber)
  const { data: issuesData } = useGithubIssues({
    owner,
    repo,
    state: 'open',
  })
  const linkPullIssue = useLinkGithubPullIssue(owner, repo, pullNumber)
  const editPull = useEditGithubPull(owner, repo, pullNumber)
  const [selectedIssueNumber, setSelectedIssueNumber] = useState('')

  const pull = data?.pull
  const comments = data?.comments ?? []
  const detectedIssueReferences = data?.detectedIssueReferences ?? []
  const availableIssues =
    issuesData?.issues.filter((issue) => issue.number !== pullNumber) ?? []

  function handleManualLink() {
    const issueNumber = Number(selectedIssueNumber)

    if (!issueNumber) {
      toast.error('Select an issue to link first.')
      return
    }

    linkPullIssue.mutate(issueNumber, {
      onSuccess: () => {
        toast.success(`Pull request #${pullNumber} linked to issue #${issueNumber}.`)
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
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-sm text-muted-foreground">
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
              {editPull.isPending ? <Spinner /> : <FilePenLine className="size-4" />}
              {isEditing ? 'Stop editing' : 'Edit details'}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle>Pull request overview</CardTitle>
            <CardDescription>
              Quick context before you open the full review flow in GitHub.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Status
              </p>
              <p className="mt-2 text-2xl font-semibold capitalize">{pull.state}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Author
              </p>
              <p className="mt-2 text-lg font-semibold">{pull.user.login}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Discussion
              </p>
              <p className="mt-2 text-lg font-semibold">
                {comments.length + 1} entries
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
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
                <p className="mt-2 text-sm text-muted-foreground">
                  No issue references detected in the PR title or description yet.
                </p>
              )}
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Link to issue
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick an open issue from this repo if you want to create the cross-link manually.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <select
                  value={selectedIssueNumber}
                  onChange={(event) => setSelectedIssueNumber(event.target.value)}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="">Select an issue</option>
                  {availableIssues.map((issue) => (
                    <option key={issue.number} value={issue.number}>
                      #{issue.number} · {issue.title}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={handleManualLink}
                  disabled={linkPullIssue.isPending || !availableIssues.length}
                >
                  {linkPullIssue.isPending ? (
                    <Spinner />
                  ) : (
                    <Link2 className="size-4" />
                  )}
                  Link issue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitPullRequest className="size-5 text-sky-600 dark:text-sky-300" />
              Pull request details
            </CardTitle>
            <CardDescription>
              Update the PR title and description here, then review the discussion below.
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
