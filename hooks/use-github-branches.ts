'use client'

import { useQuery } from '@tanstack/react-query'

import api from '@/lib/axios'
import type { GitHubBranchesResponse } from '@/lib/github/types'
import { handleApiError } from '@/lib/error-handler'

export function useGithubBranches({
  owner,
  repo,
}: {
  owner: string
  repo: string
}) {
  return useQuery({
    queryKey: ['github', 'branches', owner, repo],
    queryFn: async () => {
      try {
        const response = await api.get<GitHubBranchesResponse>(
          '/github/branches',
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
