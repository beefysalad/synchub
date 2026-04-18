import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'
import type {
  GitHubWorkflow,
  GitHubWorkflowRun,
} from '@/lib/github/types'

type GitHubWorkflowApiResponse = {
  total_count: number
  workflows: Array<{
    id: number
    name: string
    state: string
    path: string
    html_url: string
    created_at: string
    updated_at: string
    badge_url?: string
  }>
}

type GitHubWorkflowRunsApiResponse = {
  total_count: number
  workflow_runs: Array<{
    id: number
    name: string | null
    display_title?: string | null
    status: string | null
    conclusion: string | null
    html_url: string
    workflow_id: number
    run_number: number
    run_attempt: number
    event: string
    head_branch: string | null
    head_sha: string
    created_at: string
    updated_at: string
    actor?: {
      login: string
      avatar_url: string
    } | null
    head_commit?: {
      message?: string | null
    } | null
  }>
}

type ListRepositoryWorkflowRunsParams = {
  userId: string
  owner: string
  repo: string
  page?: number
  perPage?: number
  workflowId?: number
  branch?: string
  status?: string
}

export const githubWorkflowsService = {
  async listRepositoryWorkflows(
    userId: string,
    owner: string,
    repo: string
  ): Promise<GitHubWorkflow[]> {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    const response = await githubRequest<GitHubWorkflowApiResponse>(
      `/repos/${owner}/${repo}/actions/workflows?per_page=100`,
      { method: 'GET' },
      accessToken
    )

    return response.workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      state: workflow.state,
      path: workflow.path,
      htmlUrl: workflow.html_url,
      createdAt: workflow.created_at,
      updatedAt: workflow.updated_at,
      badgeUrl: workflow.badge_url ?? null,
    }))
  },

  async listRepositoryWorkflowRuns({
    userId,
    owner,
    repo,
    page = 1,
    perPage = 20,
    workflowId,
    branch,
    status,
  }: ListRepositoryWorkflowRunsParams): Promise<GitHubWorkflowRun[]> {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    const query = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
      ...(branch ? { branch } : {}),
      ...(status ? { status } : {}),
    })

    const basePath = workflowId
      ? `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`
      : `/repos/${owner}/${repo}/actions/runs`

    const response = await githubRequest<GitHubWorkflowRunsApiResponse>(
      `${basePath}?${query.toString()}`,
      { method: 'GET' },
      accessToken
    )

    return response.workflow_runs.map((run) => ({
      id: run.id,
      workflowId: run.workflow_id,
      workflowName: run.name ?? run.display_title ?? `Workflow ${run.workflow_id}`,
      status: run.status ?? 'unknown',
      conclusion: run.conclusion,
      branch: run.head_branch,
      actor: run.actor
        ? {
            login: run.actor.login,
            avatarUrl: run.actor.avatar_url,
          }
        : null,
      headSha: run.head_sha,
      headMessage: run.head_commit?.message ?? null,
      event: run.event,
      runNumber: run.run_number,
      runAttempt: run.run_attempt,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      htmlUrl: run.html_url,
    }))
  },
}
