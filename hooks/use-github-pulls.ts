import { useQuery } from '@tanstack/react-query'

import api from '@/lib/axios'
import type {
  GitHubIssueComment,
  GitHubPullRequest,
  GitHubPullRequestsResponse,
} from '@/lib/github/types'
import { handleApiError } from '@/lib/error-handler'

export function useGithubPulls({
  owner,
  repo,
  state,
}: {
  owner: string
  repo: string
  state: 'open' | 'closed' | 'all'
}) {
  return useQuery({
    queryKey: ['github', 'pulls', owner, repo, state],
    queryFn: async () => {
      try {
        const response = await api.get<GitHubPullRequestsResponse>('/github/pulls', {
          params: { owner, repo, state },
        })

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    enabled: Boolean(owner && repo),
  })
}

export function useGithubPullDetail(owner: string, repo: string, pullNumber: number) {
  return useQuery({
    queryKey: ['github', 'pulls', owner, repo, pullNumber],
    queryFn: async () => {
      try {
        const response = await api.get<{ pull: GitHubPullRequest; comments: GitHubIssueComment[] }>(
          `/github/pulls/${owner}/${repo}/${pullNumber}`
        )
        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    enabled: Boolean(owner && repo && pullNumber),
  })
}
