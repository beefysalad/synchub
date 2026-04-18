import { formatDistanceToNow } from 'date-fns'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  PlayCircle,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  useGithubWorkflowRuns,
  useGithubWorkflows,
} from '@/hooks/use-github-workflows'

function getStatusIcon(status: string | null, conclusion: string | null) {
  if (status === 'queued' || status === 'in_progress') {
    return <PlayCircle className="text-amber-500 size-4" />
  }
  if (conclusion === 'success') {
    return <CheckCircle2 className="text-[#1a7f37] dark:text-[#3fb950] size-4" />
  }
  if (conclusion === 'failure' || conclusion === 'timed_out') {
    return <XCircle className="text-red-500 size-4" />
  }
  if (conclusion === 'cancelled' || conclusion === 'skipped') {
    return <AlertCircle className="text-slate-500 size-4" />
  }
  return <PlayCircle className="text-muted-foreground size-4" />
}

export function RepositoryWorkflowsTab({
  owner,
  repo,
}: {
  owner: string
  repo: string
}) {
  const { data: workflowsData, isLoading: isLoadingWorkflows } =
    useGithubWorkflows({ owner, repo })
  const { data: runsData, isLoading: isLoadingRuns } = useGithubWorkflowRuns({
    owner,
    repo,
    page: 1,
    perPage: 15,
  })

  const workflows = workflowsData?.workflows ?? []
  const runs = runsData?.runs ?? []

  return (
    <div className="space-y-6">
      {/* Workflows List */}
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="border-b border-border bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <FileCode2 className="size-4" />
            Configured Workflows
          </h3>
        </div>
        <div className="divide-y divide-border">
          {isLoadingWorkflows ? (
            <div className="flex justify-center p-8 text-center text-sm text-muted-foreground">
              <Spinner className="size-5 text-muted-foreground/30" />
            </div>
          ) : workflows.length > 0 ? (
            workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shrink-0 pt-0.5">
                    {workflow.state === 'active' ? (
                      <CheckCircle2 className="text-[#1a7f37] size-4 dark:text-[#3fb950]" />
                    ) : (
                      <XCircle className="size-4 text-red-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {workflow.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {workflow.path}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  asChild
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Link href={workflow.htmlUrl} target="_blank">
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No workflows found in this repository.
            </div>
          )}
        </div>
      </div>

      {/* Recent Runs List */}
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="border-b border-border bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <PlayCircle className="size-4" />
            Recent Workflow Runs
          </h3>
        </div>
        <div className="divide-y divide-border">
          {isLoadingRuns ? (
            <div className="flex justify-center p-8 text-center text-sm text-muted-foreground">
              <Spinner className="size-5 text-muted-foreground/30" />
            </div>
          ) : runs.length > 0 ? (
            runs.map((run) => (
              <div
                key={run.id}
                className="flex items-center gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
              >
                <div className="shrink-0 pt-0.5">
                  {getStatusIcon(run.status, run.conclusion)}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {run.headMessage?.split('\n')[0] ?? 'Run'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {run.workflowName}
                    </span>
                    <span>•</span>
                    <span className="max-w-[120px] truncate rounded bg-muted/50 px-1 py-0.5 font-mono">
                      {run.branch}
                    </span>
                    <span>•</span>
                    {run.actor && (
                      <span className="font-medium">{run.actor.login}</span>
                    )}
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(run.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  asChild
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Link href={run.htmlUrl} target="_blank">
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No recent workflow runs.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
