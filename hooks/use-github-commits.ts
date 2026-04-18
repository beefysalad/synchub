import { useQuery } from '@tanstack/react-query'

import api from '@/lib/axios'
import type { GitHubCommitsResponse } from '@/lib/github/types'
import { handleApiError } from '@/lib/error-handler'

export function useGithubCommits({
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
    queryKey: ['github', 'commits', owner, repo, page, perPage],
    queryFn: async () => {
      try {
        const response = await api.get<GitHubCommitsResponse>('/github/commits', {
          params: { owner, repo, page, perPage },
        })

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    enabled: Boolean(owner && repo),
  })
}
