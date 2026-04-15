'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '@/lib/axios'
import {
  type CreateGitHubIssuePayload,
  type CreateGitHubIssueResponse,
  type GitHubIssueState,
  type GitHubIssuesResponse,
} from '@/lib/github/types'
import { handleApiError } from '@/lib/error-handler'

export function useGithubIssues({
  owner,
  repo,
  state,
}: {
  owner: string
  repo: string
  state: GitHubIssueState
}) {
  return useQuery({
    queryKey: ['github', 'issues', owner, repo, state],
    queryFn: async () => {
      try {
        const response = await api.get<GitHubIssuesResponse>('/github/issues', {
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

export function useCreateGithubIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateGitHubIssuePayload) => {
      try {
        const response = await api.post<CreateGitHubIssueResponse>(
          '/github/issues',
          payload
        )

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['github', 'issues', variables.owner, variables.repo],
      })
    },
  })
}
