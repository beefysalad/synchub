import { useQuery } from '@tanstack/react-query'

import api from '@/lib/axios'
import type { GitHubCommitsResponse } from '@/lib/github/types'
import { handleApiError } from '@/lib/error-handler'

export function useGithubCommits({
  owner,
  repo,
}: {
  owner: string
  repo: string
}) {
  return useQuery({
    queryKey: ['github', 'commits', owner, repo],
    queryFn: async () => {
      try {
        const response = await api.get<GitHubCommitsResponse>('/github/commits', {
          params: { owner, repo },
        })

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    enabled: Boolean(owner && repo),
  })
}
