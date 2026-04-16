'use client'

import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Trash2, Lock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { SectionHeader } from '@/components/dashboard/section-header'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  useGithubIssueDetail,
  useUpdateGithubIssueState,
  useDeleteGithubIssue,
} from '@/hooks/use-github-issues'
import Image from 'next/image'

export function IssueDetailPage({
  owner,
  repo,
  issueNumber,
}: {
  owner: string
  repo: string
  issueNumber: number
}) {
  const router = useRouter()
  const { data, isLoading, error } = useGithubIssueDetail(owner, repo, issueNumber)
  const updateState = useUpdateGithubIssueState(owner, repo, issueNumber)
  const deleteIssue = useDeleteGithubIssue(owner, repo, issueNumber)

  const issue = data?.issue
  const comments = data?.comments ?? []

  function handleClose() {
    updateState.mutate('closed', {
      onSuccess: () => {
        toast.success(`Issue #${issueNumber} closed successfully.`)
        router.push(`/repos/${owner}/${repo}`)
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  }

  function handleReopen() {
    updateState.mutate('open', {
      onSuccess: () => {
        toast.success(`Issue #${issueNumber} reopened successfully.`)
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  }

  function handleDelete() {
    if (
      !window.confirm(
        'Are you sure you want to permanently delete this issue? This action requires repository admin permissions.'
      )
    ) {
      return
    }

    deleteIssue.mutate(undefined, {
      onSuccess: () => {
        toast.success(`Issue #${issueNumber} deleted successfully.`)
        router.push(`/repos/${owner}/${repo}`)
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-sm text-muted-foreground">
        <Spinner className="size-8" />
        Loading issue details...
      </div>
    )
  }

  if (error || !issue) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
        {error?.message ?? 'Issue not found.'}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow={`${owner}/${repo} • Issue #${issue.number}`}
        title={issue.title}
        description={`Opened by ${issue.user.login} ${formatDistanceToNow(
          new Date(issue.created_at),
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
            {issue.state === 'open' ? (
              <Button
                variant="outline"
                className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/20"
                onClick={handleClose}
                disabled={updateState.isPending}
              >
                {updateState.isPending ? <Spinner /> : <Lock className="size-4" />}
                Close issue
              </Button>
            ) : (
              <Button
                variant="outline"
                className="rounded-full border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20"
                onClick={handleReopen}
                disabled={updateState.isPending}
              >
                {updateState.isPending ? <Spinner /> : <Lock className="size-4" />}
                Reopen issue
              </Button>
            )}
            <Button
              variant="outline"
              className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/20"
              onClick={handleDelete}
              disabled={deleteIssue.isPending}
            >
              {deleteIssue.isPending ? <Spinner /> : <Trash2 className="size-4" />}
              Delete via API
            </Button>
            <Button asChild className="rounded-full">
              <Link href={issue.html_url} target="_blank">
                <ExternalLink className="size-4" />
                View on GitHub
              </Link>
            </Button>
          </>
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Original Issue */}
        <div className="flex gap-4">
          <img
            src={issue.user.avatar_url ?? `https://github.com/${issue.user.login}.png`}
            alt={issue.user.login}
            className="size-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800"
          />
          <div className="min-w-0 flex-1 rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800/50 dark:bg-slate-900/50 rounded-t-3xl text-sm">
              <span className="font-semibold">{issue.user.login}</span> commented{' '}
              {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
            </div>
            <div className="prose prose-slate prose-sm max-w-none px-5 py-5 dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{issue.body || '*No description provided.*'}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Comments */}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <img
              src={comment.user.avatar_url ?? `https://github.com/${comment.user.login}.png`}
              alt={comment.user.login}
              className="size-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800"
            />
            <div className="min-w-0 flex-1 rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800/50 dark:bg-slate-900/50 rounded-t-3xl text-sm">
                <span className="font-semibold">{comment.user.login}</span> commented{' '}
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </div>
              <div className="prose prose-slate prose-sm max-w-none px-5 py-5 dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
