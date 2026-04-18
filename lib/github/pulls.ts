import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'
import type {
  GitHubCommit,
  GitHubPullFile,
  GitHubPullRequest,
} from '@/lib/github/types'

type PullListParams = {
  userId: string
  owner: string
  repo: string
  state?: 'open' | 'closed' | 'all'
  page?: number
  perPage?: number
}

type UpdatePullRequestParams = {
  userId: string
  owner: string
  repo: string
  pullNumber: number
  title?: string
  body?: string
}

type CreatePullRequestParams = {
  userId: string
  owner: string
  repo: string
  title: string
  body?: string
  head: string
  base: string
  draft?: boolean
}

export const githubPullsService = {
  async getPullRequestTemplate(userId: string, owner: string, repo: string) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    const candidatePaths = [
      '.github/pull_request_template.md',
      '.github/PULL_REQUEST_TEMPLATE.md',
      'docs/pull_request_template.md',
      'docs/PULL_REQUEST_TEMPLATE.md',
      'pull_request_template.md',
      'PULL_REQUEST_TEMPLATE.md',
    ]

    for (const path of candidatePaths) {
      try {
        const file = await githubRequest<{
          content?: string
          encoding?: string
          path?: string
        }>(
          `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
          { method: 'GET' },
          accessToken
        )

        if (file.content && file.encoding === 'base64') {
          return {
            template: Buffer.from(file.content, 'base64').toString('utf-8'),
            path: file.path ?? path,
          }
        }
      } catch {
        continue
      }
    }

    return {
      template: null,
      path: null,
    }
  },

  async listRepositoryPulls({
    userId,
    owner,
    repo,
    state = 'open',
    page = 1,
    perPage = 10,
  }: PullListParams) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    const query = new URLSearchParams({
      state,
      page: String(page),
      per_page: String(perPage),
    })

    return githubRequest<GitHubPullRequest[]>(
      `/repos/${owner}/${repo}/pulls?${query.toString()}`,
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

  async listPullRequestFiles(
    userId: string,
    owner: string,
    repo: string,
    pullNumber: number
  ) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubPullFile[]>(
      `/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100`,
      { method: 'GET' },
      accessToken
    )
  },

  async listPullRequestCommits(
    userId: string,
    owner: string,
    repo: string,
    pullNumber: number
  ) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubCommit[]>(
      `/repos/${owner}/${repo}/pulls/${pullNumber}/commits?per_page=100`,
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

  async createPullRequest({
    userId,
    owner,
    repo,
    title,
    body,
    head,
    base,
    draft,
  }: CreatePullRequestParams) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubPullRequest>(
      `/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        body: JSON.stringify({
          title,
          head,
          base,
          ...(typeof body === 'string' ? { body } : {}),
          ...(typeof draft === 'boolean' ? { draft } : {}),
        }),
      },
      accessToken
    )
  },

  async closePullRequest(userId: string, owner: string, repo: string, pullNumber: number) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubPullRequest>(
      `/repos/${owner}/${repo}/pulls/${pullNumber}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          state: 'closed',
        }),
      },
      accessToken
    )
  },
}
