import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'
import type { GitHubIssue, GitHubIssueComment } from '@/lib/github/types'

type IssueListParams = {
  userId: string
  owner: string
  repo: string
  state?: 'open' | 'closed' | 'all'
}

type CreateIssueParams = {
  userId: string
  owner: string
  repo: string
  title: string
  body?: string
  labels?: string[]
}

type UpdateIssueParams = {
  userId: string
  owner: string
  repo: string
  issueNumber: number
  title?: string
  body?: string
  state?: 'open' | 'closed'
  assignees?: string[]
}

export const githubIssueService = {
  async listRepositoryIssues({
    userId,
    owner,
    repo,
    state = 'open',
  }: IssueListParams) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    const issues = await githubRequest<GitHubIssue[]>(
      `/repos/${owner}/${repo}/issues?state=${state}&per_page=100`,
      { method: 'GET' },
      accessToken
    )

    return issues.filter((issue) => !issue.pull_request)
  },

  async createIssue({ userId, owner, repo, title, body, labels }: CreateIssueParams) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubIssue>(
      `/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        body: JSON.stringify({
          title,
          body,
          ...(labels?.length ? { labels } : {}),
        }),
      },
      accessToken
    )
  },

  async listRepositoryLabels(userId: string, owner: string, repo: string) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<Array<{ id: number; name: string; color: string }>>(
      `/repos/${owner}/${repo}/labels`,
      { method: 'GET' },
      accessToken
    )
  },

  async listAssignableUsers(userId: string, owner: string, repo: string) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<Array<{ id: number; login: string; avatar_url: string }>>(
      `/repos/${owner}/${repo}/assignees?per_page=100`,
      { method: 'GET' },
      accessToken
    )
  },

  async getIssue(userId: string, owner: string, repo: string, issueNumber: number) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubIssue>(
      `/repos/${owner}/${repo}/issues/${issueNumber}`,
      { method: 'GET' },
      accessToken
    )
  },

  async getIssueComments(userId: string, owner: string, repo: string, issueNumber: number) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubIssueComment[]>(
      `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      { method: 'GET' },
      accessToken
    )
  },

  async createIssueComment(
    userId: string,
    owner: string,
    repo: string,
    issueNumber: number,
    body: string
  ) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubIssueComment>(
      `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ body }),
      },
      accessToken
    )
  },

  async updateIssueState(userId: string, owner: string, repo: string, issueNumber: number, state: 'open' | 'closed') {
    return this.updateIssue({
      userId,
      owner,
      repo,
      issueNumber,
      state,
    })
  },

  async updateIssue({
    userId,
    owner,
    repo,
    issueNumber,
    title,
    body,
    state,
    assignees,
  }: UpdateIssueParams) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubIssue>(
      `/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          ...(typeof title === 'string' ? { title } : {}),
          ...(typeof body === 'string' ? { body } : {}),
          ...(state ? { state } : {}),
          ...(Array.isArray(assignees) ? { assignees } : {}),
        }),
      },
      accessToken
    )
  },

  async deleteIssue(userId: string, owner: string, repo: string, issueNumber: number) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }


    const issue = await this.getIssue(userId, owner, repo, issueNumber)
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeId = (issue as any).node_id

    if (!nodeId) {
      throw new Error('Could not resolve issue node_id for deletion.')
    }

    return githubRequest<{ data?: unknown }>(
      '/graphql',
      {
        method: 'POST',
        body: JSON.stringify({
          query: `mutation { deleteIssue(input: { issueId: "${nodeId}" }) { clientMutationId } }`,
        }),
      },
      accessToken
    )
  },
}
