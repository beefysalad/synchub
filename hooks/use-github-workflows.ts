import { useQuery } from '@tanstack/react-query'

import api from '@/lib/axios'
import type {
  GitHubWorkflowsResponse,
  GitHubWorkflowRunsResponse,
} from '@/lib/github/types'
import { handleApiError } from '@/lib/error-handler'

export function useGithubWorkflows({
  owner,
  repo,
}: {
  owner: string
  repo: string
}) {
  return useQuery({
    queryKey: ['github', 'workflows', owner, repo],
    queryFn: async () => {
      try {
        const response = await api.get<GitHubWorkflowsResponse>(
          '/github/workflows',
          {
            params: { owner, repo },
          }
        )

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    enabled: Boolean(owner && repo),
  })
}

export function useGithubWorkflowRuns({
  owner,
  repo,
  page = 1,
  perPage = 10,
}: {
  owner: string
  repo: string
  page?: number
  perPage?: number
}) {
  return useQuery({
    queryKey: ['github', 'workflow-runs', owner, repo, page, perPage],
    queryFn: async () => {
      try {
        const response = await api.get<GitHubWorkflowRunsResponse>(
          '/github/workflow-runs',
          {
            params: { owner, repo, page, perPage },
          }
        )

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    enabled: Boolean(owner && repo),
  })
}
