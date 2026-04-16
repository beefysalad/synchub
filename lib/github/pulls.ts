import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'
import type { GitHubPullRequest } from '@/lib/github/types'

type PullListParams = {
  userId: string
  owner: string
  repo: string
  state?: 'open' | 'closed' | 'all'
}

type UpdatePullRequestParams = {
  userId: string
  owner: string
  repo: string
  pullNumber: number
  title?: string
  body?: string
}

export const githubPullsService = {
  async listRepositoryPulls({
    userId,
    owner,
    repo,
    state = 'open',
  }: PullListParams) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubPullRequest[]>(
      `/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`,
      { method: 'GET' },
      accessToken
    )
  },

  async getPullRequest(userId: string, owner: string, repo: string, pullNumber: number) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubPullRequest>(
      `/repos/${owner}/${repo}/pulls/${pullNumber}`,
      { method: 'GET' },
      accessToken
    )
  },

  async updatePullRequest({
    userId,
    owner,
    repo,
    pullNumber,
    title,
    body,
  }: UpdatePullRequestParams) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubPullRequest>(
      `/repos/${owner}/${repo}/pulls/${pullNumber}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          ...(typeof title === 'string' ? { title } : {}),
          ...(typeof body === 'string' ? { body } : {}),
        }),
      },
      accessToken
    )
  },
}
