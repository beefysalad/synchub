import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'
import type { GitHubPullRequest } from '@/lib/github/types'

type PullListParams = {
  userId: string
  owner: string
  repo: string
  state?: 'open' | 'closed' | 'all'
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
      `/repos/${owner}/${repo}/pulls?state=${state}`,
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
}
