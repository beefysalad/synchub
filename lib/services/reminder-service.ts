import { ReminderStatus } from '@/app/generated/prisma/client'

import prisma from '@/lib/prisma'

export const reminderService = {
  async listUserReminders(
    userId: string,
    status?: ReminderStatus,
    filters?: {
      repository?: string
      issueNumber?: number
    }
  ) {
    return prisma.reminder.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
        ...(filters?.repository ? { repository: filters.repository } : {}),
        ...(filters?.issueNumber ? { issueNumber: filters.issueNumber } : {}),
        archived: false,
      },
      orderBy: [{ remindAt: 'asc' }, { createdAt: 'desc' }],
    })
  },

  async createReminder({
    userId,
    repository,
    issueNumber,
    remindAt,
    note,
  }: {
    userId: string
    repository: string
    issueNumber: number
    remindAt: Date
    note?: string
  }) {
    const normalizedNote = note?.trim() || null

    const existingPendingReminder = await prisma.reminder.findFirst({
      where: {
        userId,
        repository,
        issueNumber,
        status: 'PENDING',
        archived: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (existingPendingReminder) {
      return prisma.reminder.update({
        where: { id: existingPendingReminder.id },
        data: {
          remindAt,
          note: normalizedNote,
        },
      })
    }

    const archivedReminder = await prisma.reminder.findFirst({
      where: {
        userId,
        repository,
        issueNumber,
        archived: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    if (archivedReminder) {
      return prisma.reminder.update({
        where: { id: archivedReminder.id },
        data: {
          remindAt,
          note: normalizedNote,
          status: 'PENDING',
          archived: false,
        },
      })
    }

    return prisma.reminder.create({
      data: {
        userId,
        repository,
        issueNumber,
        remindAt,
        note: normalizedNote,
      },
    })
  },

  async updateReminder(
    userId: string,
    reminderId: string,
    updates: {
      remindAt?: Date
      note?: string | null
      status?: ReminderStatus
      archived?: boolean
    }
  ) {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId,
      },
    })

    if (!reminder) {
      throw new Error('Reminder not found.')
    }

    return prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        ...(updates.remindAt ? { remindAt: updates.remindAt } : {}),
        ...(updates.note !== undefined ? { note: updates.note } : {}),
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.archived !== undefined ? { archived: updates.archived } : {}),
      },
    })
  },

  async listDueReminders(referenceDate = new Date()) {
    return prisma.reminder.findMany({
      where: {
        status: 'PENDING',
        archived: false,
        remindAt: {
          lte: referenceDate,
        },
      },
      include: {
        user: {
          include: {
            linkedAccounts: true,
          },
        },
      },
      orderBy: {
        remindAt: 'asc',
      },
    })
  },
}
