import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '@/lib/axios'
import type {
  CreateGitHubPullPayload,
  CreateGitHubPullResponse,
  GitHubPullTemplateResponse,
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

export function useGithubPullTemplate(owner: string, repo: string) {
  return useQuery({
    queryKey: ['github', 'pull-template', owner, repo],
    queryFn: async () => {
      try {
        const response = await api.get<GitHubPullTemplateResponse>(
          '/github/pulls/template',
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

export function useUnlinkGithubPullIssue(
  owner: string,
  repo: string,
  pullNumber: number
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (issueNumbers: number[]) => {
      try {
        const response = await api.delete<{ remainingIssues: GitHubIssueReference[] }>(
          `/github/pulls/${owner}/${repo}/${pullNumber}/link`,
          { data: { issueNumbers } }
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

export function useCreateGithubPullComment(
  owner: string,
  repo: string,
  pullNumber: number
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: string) => {
      try {
        const response = await api.post(
          `/github/pulls/${owner}/${repo}/${pullNumber}`,
          { body }
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

export function useCreateGithubPull() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateGitHubPullPayload) => {
      try {
        const response = await api.post<CreateGitHubPullResponse>(
          '/github/pulls',
          payload
        )
        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['github', 'pulls', variables.owner, variables.repo],
      })
      queryClient.setQueryData(
        ['github', 'pulls', variables.owner, variables.repo, data.pull.number],
        {
          pull: data.pull,
        }
      )
    },
  })
}

export function useCloseGithubPull(
  owner: string,
  repo: string,
  pullNumber: number
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      try {
        const response = await api.delete(
          `/github/pulls/${owner}/${repo}/${pullNumber}`
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
