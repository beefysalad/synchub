import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'

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

    return githubRequest<unknown[]>(
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

    return githubRequest<unknown>(
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
}
