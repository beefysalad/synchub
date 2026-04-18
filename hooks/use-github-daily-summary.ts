'use client'

import { useMutation, useQuery } from '@tanstack/react-query'

import api from '@/lib/axios'
import { handleApiError } from '@/lib/error-handler'
import type {
  GeminiModelOption,
  GithubDailySummaryQueryResponse,
  GithubDailySummaryResponse,
  GithubDailySummarySendResponse,
} from '@/lib/github/types'

export function useGithubDailySummaryQuery() {
  return useQuery({
    queryKey: ['github', 'daily-summary'],
    queryFn: async () => {
      try {
        const response = await api.get<GithubDailySummaryQueryResponse>(
          '/ai/github/daily-summary'
        )

        return response.data.summary
      } catch (error) {
        return handleApiError(error)
      }
    },
  })
}

export function useDiscordChannels() {
  return useQuery({
    queryKey: ['integrations', 'discord', 'channels'],
    queryFn: async () => {
      try {
        const response = await api.get<{ channels: Array<{ id: string; name: string }> }>(
          '/integrations/discord/channels'
        )

        return response.data.channels
      } catch (error) {
        return handleApiError(error)
      }
    },
  })
}

export function useGithubDailySummary() {
  return useMutation({
    mutationFn: async ({ force = false }: { force?: boolean } = {}) => {
      try {
        const response = await api.post<GithubDailySummaryResponse>(
          '/ai/github/daily-summary',
          {
            force,
          }
        )

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
  })
}

export function useSendGithubDailySummary() {
  return useMutation({
    mutationFn: async ({
      providers,
    }: {
      providers: Array<'TELEGRAM' | 'DISCORD'>
    }) => {
      try {
        const response = await api.post<GithubDailySummarySendResponse>(
          '/ai/github/daily-summary/send',
          {
            providers,
          }
        )

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
  })
}

export function useUpdateDailySummarySettings() {
  return useMutation({
    mutationFn: async ({
      discordChannelId,
      aiModel,
    }: {
      discordChannelId: string
      aiModel: GeminiModelOption
    }) => {
      try {
        const response = await api.post('/settings/daily-summary', {
          discordChannelId,
          aiModel,
        })
        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
  })
}
