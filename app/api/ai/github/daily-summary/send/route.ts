import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { AccountProvider } from '@/app/generated/prisma/client'
import { dailySummaryService } from '@/lib/services/daily-summary-service'

const dailySummarySendSchema = z.object({
  providers: z
    .array(z.enum([AccountProvider.TELEGRAM, AccountProvider.DISCORD]))
    .min(1),
})

export async function POST(request: Request) {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { providers } = dailySummarySendSchema.parse(body)

    const result = await dailySummaryService.sendToLinkedApps({
      clerkUserId,
      providers,
    })

    return NextResponse.json({
      summary: result.summary,
      deliveredProviders: result.deliveredProviders,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to send daily summary'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
