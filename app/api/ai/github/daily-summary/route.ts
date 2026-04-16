import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { dailySummaryService } from '@/lib/services/daily-summary-service'

const generateDailySummarySchema = z.object({
  force: z.boolean().optional(),
})

export async function GET() {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { summary } = await dailySummaryService.getExistingForClerkUser(
      clerkUserId
    )

    return NextResponse.json({ summary })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to fetch daily summary'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { force = false } = generateDailySummarySchema.parse(body)
    const { summary } = await dailySummaryService.generateForClerkUser(
      clerkUserId,
      { force }
    )

    return NextResponse.json(summary)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to generate daily summary'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
