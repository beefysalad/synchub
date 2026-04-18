import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '@/lib/axios'
import type {
  GitHubIssueReference,
  GitHubPullDetailResponse,
  GitHubPullRequestsResponse,
  UpdateGitHubPullPayload,
} from '@/lib/github/types'
import { handleApiError } from '@/lib/error-handler'

export function useGithubPulls({
  owner,
  repo,
  state,
  page = 1,
  perPage = 10,
}: {
  owner: string
  repo: string
  state: 'open' | 'closed' | 'all'
  page?: number
  perPage?: number
}) {
  return useQuery({
    queryKey: ['github', 'pulls', owner, repo, state, page, perPage],
    queryFn: async () => {
      try {
        const response = await api.get<GitHubPullRequestsResponse>('/github/pulls', {
          params: { owner, repo, state, page, perPage },
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
        const response = await api.get<GitHubPullDetailResponse>(
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

export function useLinkGithubPullIssue(
  owner: string,
  repo: string,
  pullNumber: number
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (issueNumbers: number[]) => {
      try {
        const response = await api.post<{ linkedIssues: GitHubIssueReference[] }>(
          `/github/pulls/${owner}/${repo}/${pullNumber}/link`,
          { issueNumbers }
        )

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['github', 'pulls', owner, repo, pullNumber],
      })
    },
  })
}

export function useEditGithubPull(
  owner: string,
  repo: string,
  pullNumber: number
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateGitHubPullPayload) => {
      try {
        const response = await api.patch(
          `/github/pulls/${owner}/${repo}/${pullNumber}`,
          payload
        )
        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['github', 'pulls', owner, repo, pullNumber],
      })
      queryClient.invalidateQueries({
        queryKey: ['github', 'pulls', owner, repo],
      })
    },
  })
}
