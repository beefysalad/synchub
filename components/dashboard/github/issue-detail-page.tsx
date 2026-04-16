'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  BellRing,
  ExternalLink,
  FilePenLine,
  Lock,
  MessageSquareMore,
  Sparkles,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { useSummarizeGithubIssue } from '@/hooks/use-github-ai'
import {
  useDeleteGithubIssue,
  useEditGithubIssue,
  useGithubIssueDetail,
  useUpdateGithubIssueState,
} from '@/hooks/use-github-issues'

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
  const [isEditing, setIsEditing] = useState(false)
  const { data, isLoading, error } = useGithubIssueDetail(owner, repo, issueNumber)
  const updateState = useUpdateGithubIssueState(owner, repo, issueNumber)
  const editIssue = useEditGithubIssue(owner, repo, issueNumber)
  const deleteIssue = useDeleteGithubIssue(owner, repo, issueNumber)
  const summarizeIssue = useSummarizeGithubIssue()

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

  async function handleGenerateSummary() {
    if (!issue) {
      return
    }

    try {
      await summarizeIssue.mutateAsync({
        repository: `${owner}/${repo}`,
        issueNumber,
        title: issue.title,
        body: issue.body ?? '',
        comments: comments.map((comment) => ({
          author: comment.user.login,
          body: comment.body,
          createdAt: comment.created_at,
        })),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to summarize issue')
    }
  }

  async function handleEditSubmit(values: { title: string; body: string }) {
    try {
      await editIssue.mutateAsync(values)
      toast.success(`Issue #${issueNumber} updated successfully.`)
      setIsEditing(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update issue'
      )
    }
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
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setIsEditing((current) => !current)}
              disabled={editIssue.isPending}
            >
              {editIssue.isPending ? <Spinner /> : <FilePenLine className="size-4" />}
              {isEditing ? 'Stop editing' : 'Edit details'}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle>Issue overview</CardTitle>
            <CardDescription>
              A quick summary of the current issue state before you dive into the conversation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Status
              </p>
              <p className="mt-2 text-2xl font-semibold capitalize">{issue.state}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Author
              </p>
              <p className="mt-2 text-lg font-semibold">{issue.user.login}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Conversation
              </p>
              <p className="mt-2 text-lg font-semibold">
                {comments.length + 1} entries
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Reminder
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Schedule or adjust a follow-up reminder from a dedicated page instead of managing it inline here.
              </p>
              <div className="mt-4">
                <Button asChild className="w-full rounded-full sm:w-auto">
                  <Link href={`/issues/${owner}/${repo}/${issueNumber}/reminder`}>
                    <BellRing className="size-4" />
                    Manage reminder
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  AI summary
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={summarizeIssue.isPending}
                  onClick={handleGenerateSummary}
                >
                  {summarizeIssue.isPending ? (
                    <>
                      <Spinner />
                      Summarizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>

              {summarizeIssue.data ? (
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <p className="font-semibold text-foreground">
                      {summarizeIssue.data.headline}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Summary</p>
                    <ul className="mt-2 space-y-2 text-muted-foreground">
                      {summarizeIssue.data.summary.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  {summarizeIssue.data.risks.length ? (
                    <div>
                      <p className="font-medium text-foreground">Risks</p>
                      <ul className="mt-2 space-y-2 text-muted-foreground">
                        {summarizeIssue.data.risks.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {summarizeIssue.data.nextSteps.length ? (
                    <div>
                      <p className="font-medium text-foreground">Next steps</p>
                      <ul className="mt-2 space-y-2 text-muted-foreground">
                        {summarizeIssue.data.nextSteps.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Generate a quick Gemini summary of the issue description and discussion so far.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareMore className="size-5 text-emerald-600 dark:text-emerald-300" />
              Issue details
            </CardTitle>
            <CardDescription>
              Update the issue content here, then review the full discussion below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <EditGitHubThreadForm
                initialTitle={issue.title}
                initialBody={issue.body ?? ''}
                isPending={editIssue.isPending}
                onCancel={() => setIsEditing(false)}
                onSubmit={handleEditSubmit}
              />
            ) : (
              <ConversationEntry
                avatarUrl={issue.user.avatar_url}
                body={issue.body ?? '*No description provided.*'}
                createdAt={issue.created_at}
                username={issue.user.login}
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
