export type ReminderStatus = 'PENDING' | 'SENT' | 'CANCELED' | 'FAILED'

export type ReminderRecord = {
  id: string
  issueNumber: number
  repository: string
  remindAt: string
  status: ReminderStatus
  archived: boolean
  note: string | null
  createdAt: string
  updatedAt: string
}

export type RemindersResponse = {
  reminders: ReminderRecord[]
}

export type CreateReminderPayload = {
  repository: string
  issueNumber: number
  remindAt: string
  note?: string
}

export type UpdateReminderPayload = {
  remindAt?: string
  note?: string | null
  status?: ReminderStatus
  archived?: boolean
}
