import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'
import type { GitHubCommit } from '@/lib/github/types'

type CommitListParams = {
  userId: string
  owner: string
  repo: string
  since?: string
  page?: number
  perPage?: number
}

export const githubCommitsService = {
  async listRepositoryCommits({
    userId,
    owner,
    repo,
    since,
    page = 1,
    perPage = 10,
  }: CommitListParams) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    const query = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
      ...(since ? { since } : {}),
    })

    return githubRequest<GitHubCommit[]>(
      `/repos/${owner}/${repo}/commits?${query.toString()}`,
      { method: 'GET' },
      accessToken
    )
  },
}
