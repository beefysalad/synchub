import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { reminderService } from '@/lib/services/reminder-service'
import { updateReminderSchema } from '@/lib/validators/reminder'

async function getCurrentUser() {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return null
  }

  return prisma.user.findUnique({
    where: { clerkUserId },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = updateReminderSchema.parse(await request.json())
    const { id } = await params
    const reminder = await reminderService.updateReminder(user.id, id, {
      ...(body.remindAt ? { remindAt: new Date(body.remindAt) } : {}),
      ...(body.note !== undefined ? { note: body.note } : {}),
      ...(body.status ? { status: body.status } : {}),
      ...(body.archived !== undefined ? { archived: body.archived } : {}),
    })

    return NextResponse.json({ reminder })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to update reminder'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
