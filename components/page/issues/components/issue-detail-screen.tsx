'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  BellRing,
  Copy,
  ExternalLink,
  FilePenLine,
  GitPullRequest,
  Lock,
  MessageSquareMore,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { IssueAssigneesManager } from '@/components/page/issues/components/issue-assignees-manager'
import { GitHubCommentForm } from '@/components/shared/github-comment-form'
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
import {
  useSuggestGithubBranchNames,
} from '@/hooks/use-github-ai'
import {
  useDeleteGithubIssue,
  useEditGithubIssue,
  useGithubAssignableUsers,
  useCreateGithubIssueComment,
  useGithubIssueDetail,
  useUpdateGithubIssueState,
} from '@/hooks/use-github-issues'
import ConversationEntry from './conversation-entry'

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
  const { data, isLoading, error } = useGithubIssueDetail(
    owner,
    repo,
    issueNumber
  )
  const { data: assignableUsersData, isLoading: isLoadingAssignableUsers } =
    useGithubAssignableUsers(owner, repo)
  const updateState = useUpdateGithubIssueState(owner, repo, issueNumber)
  const editIssue = useEditGithubIssue(owner, repo, issueNumber)
  const deleteIssue = useDeleteGithubIssue(owner, repo, issueNumber)
  const createComment = useCreateGithubIssueComment(owner, repo, issueNumber)
  const suggestBranchNames = useSuggestGithubBranchNames()

  const issue = data?.issue
  const comments = data?.comments ?? []
  const linkedPulls = data?.linkedPulls ?? []
  const assignableUsers = assignableUsersData?.users ?? []

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

  async function handleSuggestBranchNames() {
    if (!issue) {
      return
    }

    try {
      const response = await suggestBranchNames.mutateAsync({
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

      if (response.suggestions.length) {
        toast.success('Branch name suggestions are ready.')
      } else {
        toast.message('No branch suggestions were returned.')
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to suggest branch names'
      )
    }
  }

  async function handleCopyBranchName(branchName: string) {
    try {
      await navigator.clipboard.writeText(branchName)
      toast.success(`Copied ${branchName}`)
    } catch {
      toast.error('Unable to copy branch name')
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

  async function handleAssigneesChange(assignees: string[]) {
    try {
      await editIssue.mutateAsync({ assignees })
      toast.success(`Assignees updated for issue #${issueNumber}.`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update assignees'
      )
    }
  }

  async function handleCreateComment(body: string) {
    try {
      await createComment.mutateAsync(body)
      toast.success(`Comment posted to issue #${issueNumber}.`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to create comment'
      )
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] flex-col items-center justify-center gap-4 text-sm">
        <Spinner className="size-8" />
        Loading issue details...
      </div>
    )
  }

  if (error || !issue) {
    return (
      <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-2xl border px-5 py-4 text-sm transition-all duration-300">
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
                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 rounded-full transition-all duration-300"
                onClick={handleClose}
                disabled={updateState.isPending}
              >
                {updateState.isPending ? (
                  <Spinner />
                ) : (
                  <Lock className="size-4" />
                )}
                Close issue
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary rounded-full transition-all duration-300"
                onClick={handleReopen}
                disabled={updateState.isPending}
              >
                {updateState.isPending ? (
                  <Spinner />
                ) : (
                  <Lock className="size-4" />
                )}
                Reopen issue
              </Button>
            )}
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 rounded-full transition-all duration-300"
              onClick={handleDelete}
              disabled={deleteIssue.isPending}
            >
              {deleteIssue.isPending ? (
                <Spinner />
              ) : (
                <Trash2 className="size-4" />
              )}
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
              {editIssue.isPending ? (
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
              <MessageSquareMore className="text-primary size-5" />
              Issue details
            </CardTitle>
            <CardDescription>
              Update the issue content here, then review the full discussion
              below.
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

            <div className="pt-6 border-t border-border">
              <GitHubCommentForm
                isPending={createComment.isPending}
                onSubmit={handleCreateComment}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 xl:sticky xl:top-6">
          <Card>
            <CardHeader className="pb-4">
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Quick context and actions without getting in the way of the issue
              body.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold capitalize">
                {issue.state}
              </span>
              <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-semibold">
                {issue.user.login}
              </span>
              <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-semibold">
                {comments.length + 1} entries
              </span>
              {linkedPulls.length ? (
                <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-semibold">
                  {linkedPulls.length} linked PR{linkedPulls.length === 1 ? '' : 's'}
                </span>
              ) : null}
            </div>

            <IssueAssigneesManager
              issue={issue}
              availableUsers={assignableUsers}
              isLoadingUsers={isLoadingAssignableUsers}
              isSaving={editIssue.isPending}
              onChange={handleAssigneesChange}
            />

            <div className="glass-surface rounded-3xl px-4 py-4 transition-all duration-300">
              <p className="text-sm font-semibold">Linked pull requests</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Jump into the pull requests that already reference this issue.
              </p>
              {linkedPulls.length ? (
                <div className="mt-4 space-y-2">
                  {linkedPulls.map((pull) => (
                    <Link
                      key={pull.id}
                      href={`/pulls/${owner}/${repo}/${pull.number}`}
                      className="block"
                    >
                      <div className="group flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm transition-all duration-300 hover:border-sky-300 hover:bg-sky-100/50 dark:border-sky-500/20 dark:bg-sky-500/10 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/20">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="shrink-0 font-semibold text-sky-950 dark:text-sky-100">
                            PR #{pull.number}
                          </span>
                          <span className="truncate text-sky-900/70 dark:text-sky-100/70">
                            {pull.title}
                          </span>
                        </div>
                        <GitPullRequest className="size-4 shrink-0 text-sky-700/50 transition-colors group-hover:text-sky-700 dark:text-sky-300/50 dark:group-hover:text-sky-300" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground mt-4 text-sm">
                  No linked pull requests detected yet.
                </p>
              )}
            </div>

            <div className="glass-surface rounded-3xl px-4 py-4 transition-all duration-300">
              <p className="text-sm font-semibold flex items-center gap-2"><BellRing className="size-4 text-primary" /> Reminder</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Set a follow-up without leaving the issue flow.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full rounded-full">
                <Link href={`/issues/${owner}/${repo}/${issueNumber}/reminder`}>
                  Manage reminder
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle>Branch naming</CardTitle>
                <CardDescription className="mt-1">
                  Generate consistent git branch suggestions for this issue.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-full w-full"
                disabled={suggestBranchNames.isPending}
                onClick={handleSuggestBranchNames}
              >
                {suggestBranchNames.isPending ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    Thinking...
                  </>
                ) : (
                  <>Suggest branch names</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {suggestBranchNames.data?.suggestions.length ? (
              <div className="space-y-3">
                {suggestBranchNames.data.suggestions.map((suggestion) => (
                  <div
                    key={suggestion.name}
                    className="rounded-xl border border-border bg-slate-50/50 px-3 py-3 dark:bg-slate-900/50"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="min-w-0">
                        <p className="text-foreground font-mono text-xs font-semibold break-all">
                          {suggestion.name}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {suggestion.reason}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="rounded-full w-full text-xs"
                        onClick={() => handleCopyBranchName(suggestion.name)}
                      >
                        <Copy className="mr-2 size-3" />
                        Copy branch name
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Let Gemini propose a few consistent branch names for this issue
                so the team follows the same naming pattern.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
