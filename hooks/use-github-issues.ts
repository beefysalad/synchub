'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '@/lib/axios'
import {
  type GitHubAssignableUsersResponse,
  type CreateGitHubIssuePayload,
  type CreateGitHubIssueResponse,
  type GitHubIssueState,
  type GitHubIssuesResponse,
  type GitHubIssueDetailResponse,
  type UpdateGitHubIssuePayload,
} from '@/lib/github/types'
import { handleApiError } from '@/lib/error-handler'

export function useGithubIssues({
  owner,
  repo,
  state,
  page = 1,
  perPage = 12,
  label,
}: {
  owner: string
  repo: string
  state: GitHubIssueState
  page?: number
  perPage?: number
  label?: string
}) {
  return useQuery({
    queryKey: ['github', 'issues', owner, repo, state, page, perPage, label],
    queryFn: async () => {
      try {
        const response = await api.get<GitHubIssuesResponse>('/github/issues', {
          params: { owner, repo, state, page, perPage, label },
        })

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    enabled: Boolean(owner && repo),
    // By giving this a 10s stale time, we prevent React Query from triggering
    // an immediate background refetch when redirecting back to the issues list.
    // If we didn't do this, it would fetch GitHub's backend immediately, which
    // hasn't indexed the issue yet, wiping out the optimistically cached issue!
    staleTime: 10 * 1000,
  })
}

export function useGithubIssueDetail(owner: string, repo: string, issueNumber: number) {
  return useQuery({
    queryKey: ['github', 'issues', owner, repo, issueNumber],
    queryFn: async () => {
      try {
        const response = await api.get<GitHubIssueDetailResponse>(
          `/github/issues/${owner}/${repo}/${issueNumber}`
        )
        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    enabled: Boolean(owner && repo && issueNumber),
  })
}

export function useGithubAssignableUsers(owner: string, repo: string) {
  return useQuery({
    queryKey: ['github', 'issues', owner, repo, 'assignees'],
    queryFn: async () => {
      try {
        const response = await api.get<GitHubAssignableUsersResponse>(
          '/github/issues/assignees',
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
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateGithubIssueState(owner: string, repo: string, issueNumber: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (state: 'open' | 'closed') => {
      try {
        const response = await api.patch(
          `/github/issues/${owner}/${repo}/${issueNumber}`,
          { state }
        )
        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['github', 'issues', owner, repo],
      })
    },
  })
}

export function useDeleteGithubIssue(owner: string, repo: string, issueNumber: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      try {
        const response = await api.delete(
          `/github/issues/${owner}/${repo}/${issueNumber}`
        )
        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['github', 'issues', owner, repo],
      })
    },
  })
}

export function useEditGithubIssue(owner: string, repo: string, issueNumber: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateGitHubIssuePayload) => {
      try {
        const response = await api.patch(
          `/github/issues/${owner}/${repo}/${issueNumber}`,
          payload
        )
        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['github', 'issues', owner, repo, issueNumber],
      })
      queryClient.invalidateQueries({
        queryKey: ['github', 'issues', owner, repo],
      })
      queryClient.invalidateQueries({
        queryKey: ['github', 'issues', owner, repo, 'assignees'],
      })
    },
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
    onSuccess: (data, variables) => {
      // Because GitHub's search API takes a moment to index new issues, 
      // invalidating immediately often returns the old list. 
      // Instead, we manually inject the returned issue directly into the cache!
      const createdIssueLabelNames = data.issue.labels.map((label) => label.name)

      const updateData = (oldData: GitHubIssuesResponse | undefined) => {
        if (!oldData) return oldData

        const nextIssues = [
          data.issue,
          ...oldData.issues.filter((issue) => issue.id !== data.issue.id),
        ].slice(0, oldData.pagination.perPage)

        return {
          ...oldData,
          issues: nextIssues,
        }
      }

      for (const [queryKey, cachedData] of queryClient.getQueriesData<GitHubIssuesResponse>({
        queryKey: ['github', 'issues', variables.owner, variables.repo],
      })) {
        if (!cachedData || !Array.isArray(queryKey)) {
          continue
        }

        const state = queryKey[4]
        const page = queryKey[5]
        const label = queryKey[7]

        if ((state !== 'open' && state !== 'all') || page !== 1) {
          continue
        }

        if (
          typeof label === 'string' &&
          !createdIssueLabelNames.includes(label)
        ) {
          continue
        }

        queryClient.setQueryData(queryKey, updateData)
      }
    },
  })
}
