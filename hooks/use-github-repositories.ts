'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '@/lib/axios'
import {
  type GitHubRepositoriesResponse,
  type UpdateGitHubPreferencesPayload,
} from '@/lib/github/types'
import { handleApiError } from '@/lib/error-handler'

const githubRepositoriesQueryKey = ['github', 'repositories'] as const

export function useGithubRepositories() {
  return useQuery({
    queryKey: githubRepositoriesQueryKey,
    queryFn: async () => {
      try {
        const response = await api.get<GitHubRepositoriesResponse>(
          '/github/repositories'
        )

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
  })
}

export function useUpdateGithubPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateGitHubPreferencesPayload) => {
      try {
        const response = await api.patch<{
          preferences: GitHubRepositoriesResponse['preferences']
        }>('/github/preferences', payload)

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: githubRepositoriesQueryKey,
      })
    },
  })
}
