'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ExternalLink,
  FileCode2,
  FilePenLine,
  GitPullRequest,
  Link2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { EditGitHubThreadForm } from '@/components/shared/edit-github-thread-form'
import { GitHubCommentForm } from '@/components/shared/github-comment-form'
import { SectionHeader } from '@/components/shared/section-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  useCreateGithubPullComment,
  useEditGithubPull,
  useGithubPullDetail,
  useLinkGithubPullIssue,
  useUnlinkGithubPullIssue,
  useCloseGithubPull,
} from '@/hooks/use-github-pulls'

interface DiffRow {
  type: 'header' | 'context' | 'addition' | 'deletion' | 'modification'
  leftLineNum?: number
  rightLineNum?: number
  leftContent?: string
  rightContent?: string
}

function parsePatchToSplit(patch: string): DiffRow[] {
  const lines = patch.split('\n')
  const rows: DiffRow[] = []

  let leftLineNum = 0
  let rightLineNum = 0

  let deletionBuffer: { lineNum: number; content: string }[] = []
  let additionBuffer: { lineNum: number; content: string }[] = []

  const flushBuffers = () => {
    const max = Math.max(deletionBuffer.length, additionBuffer.length)
    for (let i = 0; i < max; i++) {
      const del = deletionBuffer[i]
      const add = additionBuffer[i]

      rows.push({
        type: del && add ? 'modification' : del ? 'deletion' : 'addition',
        leftLineNum: del?.lineNum,
        rightLineNum: add?.lineNum,
        leftContent: del?.content,
        rightContent: add?.content,
      })
    }
    deletionBuffer = []
    additionBuffer = []
  }

  for (const line of lines) {
    if (line.startsWith('@@')) {
      flushBuffers()
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (match) {
        leftLineNum = parseInt(match[1], 10)
        rightLineNum = parseInt(match[2], 10)
      }
      rows.push({ type: 'header', leftContent: line, rightContent: line })
    } else if (line.startsWith('-')) {
      deletionBuffer.push({ lineNum: leftLineNum++, content: line })
    } else if (line.startsWith('+')) {
      additionBuffer.push({ lineNum: rightLineNum++, content: line })
    } else if (line.startsWith('\\ No newline')) {
      // ignore
    } else {
      // context
      flushBuffers()
      rows.push({
        type: 'context',
        leftLineNum: leftLineNum++,
        rightLineNum: rightLineNum++,
        leftContent: line,
        rightContent: line,
      })
    }
  }
  flushBuffers()
  return rows
}

function SplitDiffViewer({ patch }: { patch: string }) {
  const rows = parsePatchToSplit(patch)

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-[#0d1117]">
      <table className="w-full min-w-[700px] border-collapse font-mono text-[13px] leading-[20px]">
        <colgroup>
          <col className="w-12 min-w-[48px]" />
          <col className="w-[50%]" />
          <col className="w-12 min-w-[48px]" />
          <col className="w-[50%]" />
        </colgroup>
        <tbody>
          {rows.map((row, i) => {
            if (row.type === 'header') {
              return (
                <tr
                  key={i}
                  className="bg-[#f1f8ff] text-[#0366d6] dark:bg-[#1f2f45] dark:text-[#79c0ff]"
                >
                  <td className="p-0 text-right opacity-50 select-none" />
                  <td className="px-4 py-1" colSpan={3}>
                    <span className="whitespace-pre">{row.leftContent}</span>
                  </td>
                </tr>
              )
            }

            const isDel = row.type === 'deletion' || row.type === 'modification'
            const isAdd = row.type === 'addition' || row.type === 'modification'

            const leftBg = isDel ? 'bg-[#ffeef0] dark:bg-[#4e1c23]' : ''
            const leftText = isDel
              ? 'text-[#cb2431] dark:text-[#ff7b72]'
              : 'text-slate-800 dark:text-slate-200'
            const leftNumBg = isDel ? 'bg-[#ffdce0] dark:bg-[#4e1c23]' : ''

            const rightBg = isAdd ? 'bg-[#e6ffed] dark:bg-[#1e4620]' : ''
            const rightText = isAdd
              ? 'text-[#22863a] dark:text-[#7ee787]'
              : 'text-slate-800 dark:text-slate-200'
            const rightNumBg = isAdd ? 'bg-[#ccffd8] dark:bg-[#1e4620]' : ''

            return (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#161b22]">
                <td
                  className={`border-r border-[#d0d7de] px-2 text-right opacity-50 select-none dark:border-[#30363d] ${leftNumBg}`}
                >
                  {row.leftLineNum}
                </td>
                <td className={`px-4 py-[1px] ${leftBg} ${leftText}`}>
                  <span className="break-all whitespace-pre-wrap">
                    {row.leftContent || ' '}
                  </span>
                </td>

                <td
                  className={`border-x border-[#d0d7de] px-2 text-right opacity-50 select-none dark:border-[#30363d] ${rightNumBg}`}
                >
                  {row.rightLineNum}
                </td>
                <td className={`px-4 py-[1px] ${rightBg} ${rightText}`}>
                  <span className="break-all whitespace-pre-wrap">
                    {row.rightContent || ' '}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

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
      <div className="mt-1 hidden sm:block">
        <Image
          src={avatarUrl ?? `https://github.com/${username}.png`}
          alt={username}
          width={40}
          height={40}
          className="border-border/50 size-10 shrink-0 rounded-full border bg-slate-100 dark:bg-slate-800"
        />
      </div>
      <div className="border-border bg-background min-w-0 flex-1 overflow-hidden rounded-xl border shadow-sm">
        <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-4 py-2.5 text-sm dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-semibold">{username}</span>
            <span className="text-muted-foreground">
              commented{' '}
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        <div className="prose prose-slate prose-sm dark:prose-invert max-w-none px-4 py-4">
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
  const [activeTab, setActiveTab] = useState<
    'conversation' | 'commits' | 'changes'
  >('conversation')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedFileSha, setSelectedFileSha] = useState<string | null>(null)
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
  const unlinkPullIssue = useUnlinkGithubPullIssue(owner, repo, pullNumber)
  const createComment = useCreateGithubPullComment(owner, repo, pullNumber)
  const editPull = useEditGithubPull(owner, repo, pullNumber)
  const closePull = useCloseGithubPull(owner, repo, pullNumber)
  const [selectedIssueNumbers, setSelectedIssueNumbers] = useState<number[]>([])
  const [issueSearch, setIssueSearch] = useState('')
  const [showOverview, setShowOverview] = useState(true)
  const [showFileList, setShowFileList] = useState(true)

  const pull = data?.pull
  const comments = data?.comments ?? []
  const files = data?.files ?? []
  const commits = data?.commits ?? []
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
  const filteredAvailableIssues = availableIssues.filter((issue) => {
    const query = issueSearch.toLowerCase()
    return (
      issue.title.toLowerCase().includes(query) ||
      issue.number.toString().includes(query)
    )
  })

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

  function handleUnlink(issueNumber: number) {
    if (unlinkPullIssue.isPending) return
    unlinkPullIssue.mutate([issueNumber], {
      onSuccess: () => toast.success(`Issue #${issueNumber} unlinked from pull request.`),
      onError: (err) => toast.error(err.message)
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

  async function handleCreateComment(body: string) {
    try {
      await createComment.mutateAsync(body)
      toast.success(`Comment posted to pull request #${pullNumber}.`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to create comment'
      )
      throw error
    }
  }

  async function handleClosePull() {
    const confirmed = window.confirm(
      'Are you sure you want to close this pull request? This will "delete" it from the active SyncHub view and mark it as closed on GitHub.'
    )

    if (!confirmed) return

    try {
      await closePull.mutateAsync()
      toast.success(`Pull request #${pullNumber} closed.`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to close pull request'
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
            <Button
              variant="outline"
              className="rounded-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleClosePull}
              disabled={closePull.isPending || pull.state === 'closed'}
            >
              {closePull.isPending ? (
                <Spinner />
              ) : (
                <Trash2 className="size-4" />
              )}
              {pull.state === 'closed' ? 'Closed' : 'Delete from SyncHub'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => setShowOverview((prev) => !prev)}
              title={showOverview ? 'Hide overview' : 'Show overview'}
            >
              {showOverview ? (
                <PanelRightClose className="size-4" />
              ) : (
                <PanelRightOpen className="size-4" />
              )}
            </Button>
          </>
        }
      />

      <div
        className={`grid items-start gap-6 transition-all duration-300 ${
          showOverview
            ? 'xl:grid-cols-[minmax(0,1.35fr)_320px]'
            : 'xl:grid-cols-1'
        }`}
      >
        <div className="min-w-0">
          <div className="border-border mb-6 flex gap-6 border-b">
            <button
              type="button"
              onClick={() => setActiveTab('conversation')}
              className={`relative pb-3 text-sm font-semibold transition-colors ${
                activeTab === 'conversation'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Conversation
              {activeTab === 'conversation' && (
                <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('commits')}
              className={`relative flex items-center gap-2 pb-3 text-sm font-semibold transition-colors ${
                activeTab === 'commits'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Commits
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-bold">
                {commits.length}
              </span>
              {activeTab === 'commits' && (
                <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('changes')}
              className={`relative flex items-center gap-2 pb-3 text-sm font-semibold transition-colors ${
                activeTab === 'changes'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Files changed
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-bold">
                {files.length}
              </span>
              {activeTab === 'changes' && (
                <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full" />
              )}
            </button>
          </div>

          <div className="pt-2">
            {activeTab === 'commits' ? (
              <div className="animate-in fade-in duration-300">
                {commits.length ? (
                  <div className="border-border bg-background overflow-hidden rounded-xl border shadow-sm">
                    {commits.map((commitData, idx) => (
                      <div
                        key={commitData.sha}
                        className={`flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                          idx !== commits.length - 1
                            ? 'border-border border-b'
                            : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {commitData.commit.message.split('\n')[0]}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            {commitData.author?.avatar_url ? (
                              <Image
                                src={commitData.author.avatar_url}
                                alt={commitData.author.login ?? 'Author'}
                                width={16}
                                height={16}
                                className="rounded-full"
                              />
                            ) : null}
                            <span className="text-muted-foreground text-xs font-semibold">
                              {commitData.author?.login ??
                                commitData.commit.author.name}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              committed{' '}
                              {formatDistanceToNow(
                                new Date(commitData.commit.author.date),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-muted-foreground font-mono text-xs">
                            {commitData.sha.substring(0, 7)}
                          </span>
                          <Button
                            asChild
                            variant="ghost"
                            className="text-muted-foreground h-7 px-2.5 text-xs"
                          >
                            <Link href={commitData.html_url} target="_blank">
                              <ExternalLink className="mr-1.5 size-3.5" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
                    No commits found for this pull request.
                  </div>
                )}
              </div>
            ) : activeTab === 'changes' ? (
              <div className="animate-in fade-in duration-300">
                {files.length ? (
                  <div
                    className={`grid grid-cols-1 gap-6 transition-all duration-300 ${
                      showFileList
                        ? 'lg:grid-cols-[280px_minmax(0,1fr)]'
                        : 'lg:grid-cols-1'
                    }`}
                  >
                    {showFileList ? (
                      <div className="border-border relative flex max-h-[70vh] flex-col gap-1 overflow-y-auto rounded-xl border bg-slate-50/50 p-2 dark:bg-slate-900/20">
                        <div className="flex items-center justify-between px-3 py-2">
                          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                            Files changed
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowFileList(false)}
                            title="Hide file list"
                          >
                            <PanelLeftClose className="size-3.5" />
                          </Button>
                        </div>
                        {files.map((file) => {
                          const isActive =
                            (selectedFileSha || files[0]?.sha) === file.sha
                          return (
                            <button
                              key={file.sha}
                              onClick={() => setSelectedFileSha(file.sha)}
                              className={`flex flex-col items-start gap-1 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                isActive
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              <span className="w-full truncate font-mono text-xs">
                                {file.filename}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] font-medium">
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  +{file.additions}
                                </span>
                                <span className="text-red-600 dark:text-red-400">
                                  -{file.deletions}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    ) : null}

                    <div className="min-w-0">
                      {(() => {
                        const file = files.find(
                          (f) => f.sha === (selectedFileSha || files[0]?.sha)
                        )
                        if (!file) return null

                        return (
                          <div
                            key={file.sha}
                            className="border-border bg-background overflow-hidden rounded-xl border shadow-sm"
                          >
                            <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-4 py-2.5 dark:bg-slate-900/50">
                              <div className="flex min-w-0 items-center gap-3">
                                {!showFileList && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-1 size-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowFileList(true)}
                                    title="Show file list"
                                  >
                                    <PanelLeftOpen className="size-4" />
                                  </Button>
                                )}
                                <span className="text-muted-foreground mt-0.5 font-mono text-xs">
                                  {file.status === 'modified'
                                    ? `${file.changes} changes`
                                    : file.status}
                                </span>
                                <div className="flex min-w-0 items-center gap-2">
                                  <FileCode2 className="text-muted-foreground size-4 shrink-0" />
                                  <p className="truncate font-mono text-sm font-medium">
                                    {file.filename}
                                  </p>
                                </div>
                                {file.previous_filename ? (
                                  <p className="text-muted-foreground mt-0.5 text-xs">
                                    Renamed from {file.previous_filename}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-3 text-xs font-semibold">
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  +{file.additions}
                                </span>
                                <span className="text-red-600 dark:text-red-400">
                                  -{file.deletions}
                                </span>
                                <Button
                                  asChild
                                  variant="ghost"
                                  className="text-muted-foreground h-7 px-2.5 text-xs"
                                >
                                  <Link href={file.blob_url} target="_blank">
                                    <ExternalLink className="mr-1.5 size-3.5" />
                                    View
                                  </Link>
                                </Button>
                              </div>
                            </div>

                            {file.patch ? (
                              <div className="border-border max-h-[70vh] overflow-auto border-t">
                                <SplitDiffViewer patch={file.patch} />
                              </div>
                            ) : (
                              <div className="text-muted-foreground flex items-center gap-2 bg-white px-4 py-4 text-sm dark:bg-slate-950">
                                <ChevronDown className="size-4" />
                                GitHub did not return an inline patch for this
                                file.
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
                    No changed files were returned for this pull request.
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-in fade-in space-y-6 duration-300">
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

                <GitHubCommentForm
                  isPending={createComment.isPending}
                  onSubmit={handleCreateComment}
                />
              </div>
            )}
          </div>
        </div>

        {showOverview && (
          <Card className="xl:sticky xl:top-6">
            <CardHeader className="pb-4">
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="border-border flex flex-wrap gap-2 border-b pb-6">
              <span className="rounded bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-700 capitalize dark:text-sky-300">
                {pull.state}
              </span>
              <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-semibold">
                {pull.user.login}
              </span>
              <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-semibold">
                {comments.length + 1} entries
              </span>
            </div>

            <div className="border-border border-b pb-6">
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                Branch
              </p>
              <div className="flex items-center gap-2">
                <GitPullRequest className="text-muted-foreground size-4" />
                <span className="bg-primary/10 text-primary rounded-md px-2 py-1 font-mono text-xs font-semibold">
                  {pull.head.ref}
                </span>
              </div>
            </div>

            {likelyLinkedIssue &&
              !linkedIssues.some(
                (li) => li.number === likelyLinkedIssue.number
              ) && (
                <div className="border-border border-b pb-6">
                  <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider text-sky-600 uppercase dark:text-sky-400">
                    Likely linked issue
                  </p>
                  <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm dark:border-sky-500/20 dark:bg-sky-500/10">
                    <p className="font-semibold text-sky-950 dark:text-sky-100">
                      {likelyLinkedIssue.fullName} #{likelyLinkedIssue.number}
                    </p>
                    <p className="mt-1 text-xs text-sky-900/80 dark:text-sky-100/80">
                      {likelyLinkedIssueDetails?.title ??
                        `Detected from branch name \`${pull.head.ref}\`.`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full text-xs"
                    onClick={() => addSelectedIssue(likelyLinkedIssue.number)}
                  >
                    Add issue to linker
                  </Button>
                </div>
              )}

            <div className="border-border border-b pb-6">
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                Linked issues
              </p>
              {linkedIssues.length ? (
                <div className="space-y-2">
                  {linkedIssues.map((reference) => {
                    const isInternal = Boolean(reference.internalHref)
                    const href = reference.internalHref ?? reference.externalHref

                    return (
                      <div
                        key={`${reference.fullName}#${reference.number}`}
                        className="group flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-100/50 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/20"
                      >
                        <Link
                          href={href}
                          target={isInternal ? undefined : '_blank'}
                          className="flex min-w-0 flex-1 items-center gap-2"
                        >
                          <span className="shrink-0 font-semibold text-xs text-emerald-950 dark:text-emerald-100">
                            #{reference.number}
                          </span>
                          <span className="truncate text-xs text-emerald-900/70 dark:text-emerald-100/70">
                            {reference.title ?? 'Linked from PR'}
                          </span>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={unlinkPullIssue.isPending}
                          className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-emerald-200/50 hover:text-emerald-900 dark:hover:bg-emerald-500/30 dark:hover:text-emerald-100 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleUnlink(reference.number)
                          }}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">None</p>
              )}
            </div>

            <div>
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                Link to issue
              </p>

              <div className="space-y-4">
                {selectedIssues.length ? (
                  <div className="border-border flex flex-wrap gap-1.5 border-b pb-4">
                    {selectedIssues.map((issue) => (
                      <button
                        key={issue.number}
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 transition-all duration-300 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
                        onClick={() => toggleSelectedIssue(issue.number)}
                      >
                        <span>#{issue.number}</span>
                        <X className="size-3" />
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                  <Input
                    placeholder="Search issues..."
                    value={issueSearch}
                    onChange={(e) => setIssueSearch(e.target.value)}
                    className="h-8 rounded-lg bg-slate-50 pl-8 text-xs dark:bg-slate-900/50"
                  />
                </div>

                <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                  {filteredAvailableIssues.map((issue) => {
                    const isSelected = selectedIssueNumbers.includes(
                      issue.number
                    )
                    return (
                      <button
                        key={issue.number}
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-1.5 text-left transition-all duration-300 ${
                          isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        onClick={() => toggleSelectedIssue(issue.number)}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 text-xs font-semibold">
                            #{issue.number}
                          </span>
                          <span className="text-muted-foreground truncate text-xs">
                            {issue.title}
                          </span>
                        </div>
                        {isSelected && <Check className="size-3 shrink-0" />}
                      </button>
                    )
                  })}
                  {filteredAvailableIssues.length === 0 && (
                    <p className="text-muted-foreground py-4 text-center text-xs">
                      No issues match your search.
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full rounded-full text-xs"
                  onClick={handleManualLink}
                  disabled={
                    linkPullIssue.isPending ||
                    !availableIssues.length ||
                    !selectedIssueNumbers.length
                  }
                >
                  {linkPullIssue.isPending ? (
                    <Spinner className="mr-2" />
                  ) : (
                    <Link2 className="mr-2 size-3.5" />
                  )}
                  Link selected issues natively
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}
