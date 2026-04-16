import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'
import type { GitHubCommit } from '@/lib/github/types'

type CommitListParams = {
  userId: string
  owner: string
  repo: string
  since?: string
}

export const githubCommitsService = {
  async listRepositoryCommits({
    userId,
    owner,
    repo,
    since,
  }: CommitListParams) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    const query = new URLSearchParams({
      per_page: '100',
      ...(since ? { since } : {}),
    })

    return githubRequest<GitHubCommit[]>(
      `/repos/${owner}/${repo}/commits?${query.toString()}`,
      { method: 'GET' },
      accessToken
    )
  },
}
