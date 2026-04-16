'use client'

import { useMutation } from '@tanstack/react-query'

import api from '@/lib/axios'
import { handleApiError } from '@/lib/error-handler'
import type {
  GithubIssueDraftResponse,
  GithubIssueSummaryResponse,
  GithubLabelSuggestionsResponse,
} from '@/lib/github/types'

export function useDraftGithubIssue() {
  return useMutation({
    mutationFn: async (payload: {
      repository: string
      template: string
      title: string
      currentBody: string
    }) => {
      try {
        const response = await api.post<GithubIssueDraftResponse>(
          '/ai/github/issues/draft',
          payload
        )

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
  })
}

export function useSuggestGithubLabels() {
  return useMutation({
    mutationFn: async (payload: {
      owner: string
      repo: string
      template: string
      title: string
      body: string
    }) => {
      try {
        const response = await api.post<GithubLabelSuggestionsResponse>(
          '/ai/github/labels',
          payload
        )

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
  })
}

export function useSummarizeGithubIssue() {
  return useMutation({
    mutationFn: async (payload: {
      repository: string
      issueNumber: number
      title: string
      body: string
      comments: Array<{
        author: string
        body: string
        createdAt: string
      }>
    }) => {
      try {
        const response = await api.post<GithubIssueSummaryResponse>(
          '/ai/github/issues/summary',
          payload
        )

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
  })
}
