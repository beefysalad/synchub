import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AccountProvider } from '@/app/generated/prisma/client'
import prisma from '@/lib/prisma'

const dailySummarySettingsSchema = z.object({
  discordChannelId: z.string().trim().optional(),
  reminderChannelId: z.string().trim().optional(),
  aiModel: z.enum(['gemini-2.5-flash', 'gemini-2.5-flash-lite']),
})

export async function POST(request: Request) {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { discordChannelId, reminderChannelId, aiModel } =
      dailySummarySettingsSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        linkedAccounts: {
          where: { provider: AccountProvider.DISCORD },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const discordAccount = user.linkedAccounts[0]

    await prisma.user.update({
      where: { id: user.id },
      data: { aiModel },
    })

    if (discordAccount) {
      const currentMetadata =
        discordAccount.metadata && typeof discordAccount.metadata === 'object'
          ? (discordAccount.metadata as Record<string, unknown>)
          : {}

      await prisma.linkedAccount.update({
        where: { id: discordAccount.id },
        data: {
          metadata: {
            ...currentMetadata,
            dailySummaryChannelId: discordChannelId || undefined,
            reminderChannelId: reminderChannelId || undefined,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to save settings'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
