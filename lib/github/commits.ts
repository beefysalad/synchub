import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'
import type { GitHubCommit } from '@/lib/github/types'

type CommitListParams = {
  userId: string
  owner: string
  repo: string
}

export const githubCommitsService = {
  async listRepositoryCommits({
    userId,
    owner,
    repo,
  }: CommitListParams) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    // By default, GitHub returns commits from the default branch.
    // We'll just fetch the top 20.
    return githubRequest<GitHubCommit[]>(
      `/repos/${owner}/${repo}/commits?per_page=20`,
      { method: 'GET' },
      accessToken
    )
  },
}
