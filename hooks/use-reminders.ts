'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '@/lib/axios'
import { handleApiError } from '@/lib/error-handler'
import type {
  CreateReminderPayload,
  RemindersResponse,
  ReminderRecord,
  ReminderStatus,
  UpdateReminderPayload,
} from '@/lib/reminders/types'

export function useReminders(
  status?: ReminderStatus | 'ALL',
  filters?: {
    repository?: string
    issueNumber?: number
  }
) {
  return useQuery({
    queryKey: [
      'reminders',
      status ?? 'ALL',
      filters?.repository ?? 'ALL_REPOS',
      filters?.issueNumber ?? 'ALL_ISSUES',
    ],
    queryFn: async () => {
      try {
        const response = await api.get<RemindersResponse>('/reminders', {
          params: {
            ...(status && status !== 'ALL' ? { status } : {}),
            ...(filters?.repository ? { repository: filters.repository } : {}),
            ...(filters?.issueNumber ? { issueNumber: filters.issueNumber } : {}),
          },
        })

        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
  })
}

export function useIssueReminder(repository: string, issueNumber: number) {
  return useQuery<ReminderRecord | null>({
    queryKey: ['reminders', 'issue', repository, issueNumber],
    queryFn: async () => {
      try {
        const response = await api.get<RemindersResponse>('/reminders', {
          params: {
            status: 'PENDING',
            repository,
            issueNumber,
          },
        })

        return response.data.reminders[0] ?? null
      } catch (error) {
        return handleApiError(error)
      }
    },
  })
}

export function useCreateReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateReminderPayload) => {
      try {
        const response = await api.post('/reminders', payload)
        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}

export function useUpdateReminder(reminderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateReminderPayload) => {
      try {
        const response = await api.patch(`/reminders/${reminderId}`, payload)
        return response.data
      } catch (error) {
        return handleApiError(error)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}
