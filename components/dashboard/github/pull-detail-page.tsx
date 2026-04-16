'use client'

import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, ExternalLink, GitPullRequest } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { SectionHeader } from '@/components/dashboard/section-header'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useGithubPullDetail } from '@/hooks/use-github-pulls'

export function PullDetailPage({
  owner,
  repo,
  pullNumber,
}: {
  owner: string
  repo: string
  pullNumber: number
}) {
  const { data, isLoading, error } = useGithubPullDetail(owner, repo, pullNumber)

  const pull = data?.pull
  const comments = data?.comments ?? []

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
              <Link href={`/repos/${owner}/${repo}?tab=pulls`}>
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
          </>
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Original PR Body */}
        <div className="flex gap-4">
          <img
            src={pull.user.avatar_url ?? `https://github.com/${pull.user.login}.png`}
            alt={pull.user.login}
            className="size-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800"
          />
          <div className="min-w-0 flex-1 rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800/50 dark:bg-slate-900/50 rounded-t-3xl text-sm">
              <span className="font-semibold">{pull.user.login}</span> commented{' '}
              {formatDistanceToNow(new Date(pull.created_at), { addSuffix: true })}
            </div>
            <div className="prose prose-slate prose-sm max-w-none px-5 py-5 dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{pull.body || '*No description provided.*'}</ReactMarkdown>
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
