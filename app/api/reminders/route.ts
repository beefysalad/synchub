import { auth } from '@clerk/nextjs/server'
import { ReminderStatus } from '@/app/generated/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { reminderService } from '@/lib/services/reminder-service'
import { createReminderSchema } from '@/lib/validators/reminder'

async function getCurrentUser() {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return null
  }

  return prisma.user.findUnique({
    where: { clerkUserId },
  })
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = request.nextUrl.searchParams.get('status')
  const repository = request.nextUrl.searchParams.get('repository') ?? undefined
  const issueNumberParam = request.nextUrl.searchParams.get('issueNumber')
  const issueNumber = issueNumberParam ? Number(issueNumberParam) : undefined
  const normalizedStatus =
    status && ['PENDING', 'SENT', 'CANCELED', 'FAILED'].includes(status)
      ? (status as ReminderStatus)
      : undefined

  const reminders = await reminderService.listUserReminders(
    user.id,
    normalizedStatus,
    {
      repository,
      issueNumber:
        issueNumber !== undefined && Number.isInteger(issueNumber)
          ? issueNumber
          : undefined,
    }
  )

  return NextResponse.json({ reminders })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = createReminderSchema.parse(await request.json())
    const reminder = await reminderService.createReminder({
      userId: user.id,
      repository: body.repository,
      issueNumber: body.issueNumber,
      remindAt: new Date(body.remindAt),
      note: body.note,
    })

    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to create reminder'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
