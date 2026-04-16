import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AccountProvider } from '@/app/generated/prisma/client'

import api from '@/lib/axios'
import { handleApiError } from '@/lib/error-handler'

export type NotificationRule = {
  id: string
  repoId: string
  provider: AccountProvider
  events: string[]
  channelOverrides?: Record<string, string> | null
}

export type GitHubWebhookStatus = {
  exists: boolean
  active: boolean
  events: string[]
  isSyncHubManaged: boolean
  lastResponse: {
    code: number | null
    status: string
    message: string | null
  } | null
  updatedAt: string | null
}

export type DiscordChannelOption = {
  id: string
  name: string
  type: number
}

export function useGithubNotifications(owner: string, repo: string, provider?: AccountProvider) {
  return useQuery({
    queryKey: ['github', 'notifications', owner, repo, provider],
    queryFn: async () => {
      try {
        const response = await api.get<{
          rules: NotificationRule[]
          webhookStatus: GitHubWebhookStatus | null
          supportedEvents: string[]
          discordChannels: DiscordChannelOption[]
        }>('/github/notifications', {
          params: { owner, repo, provider },
        })
        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    enabled: Boolean(owner && repo),
  })
}

export function useUpdateNotificationRule(owner: string, repo: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      provider,
      events,
      channelOverrides,
    }: {
      provider: AccountProvider
      events: string[]
      channelOverrides?: Record<string, string>
    }) => {
      try {
        const response = await api.post<{ success: boolean; message: string }>('/github/notifications', {
          owner,
          repo,
          provider,
          events,
          channelOverrides,
        })
        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['github', 'notifications', owner, repo],
      })
    },
  })
}
