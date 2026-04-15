import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'
import type { GitHubIssue } from '@/lib/github/types'

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

    return githubRequest<GitHubIssue[]>(
      `/repos/${owner}/${repo}/issues?state=${state}`,
      { method: 'GET' },
      accessToken
    )
  },

  async createIssue({ userId, owner, repo, title, body }: CreateIssueParams) {
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
        }),
      },
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

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    return githubRequest<any[]>(
      `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      { method: 'GET' },
      accessToken
    )
  },

  async updateIssueState(userId: string, owner: string, repo: string, issueNumber: number, state: 'open' | 'closed') {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubIssue>(
      `/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ state }),
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

    return fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `mutation { deleteIssue(input: { issueId: "${nodeId}" }) { clientMutationId } }`,
      }),
    }).then((res) => {
      if (!res.ok) throw new Error('Failed to delete issue via GraphQL.')
      return res.json()
    })
  },
}
