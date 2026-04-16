import { NextRequest, NextResponse } from 'next/server'

import { dailySummaryService } from '@/lib/services/daily-summary-service'

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    throw new Error('CRON_SECRET is not configured.')
  }

  return request.headers.get('authorization') === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const force = request.nextUrl.searchParams.get('force') === 'true'
    const result = await dailySummaryService.generateForAllUsers({ force })

    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to generate daily summaries'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
