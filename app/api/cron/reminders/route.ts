import { NextResponse } from 'next/server'

import { reminderDeliveryService } from '@/lib/services/reminder-delivery-service'

function isAuthorized(request: Request) {
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    return true
  }

  const authorization = request.headers.get('authorization')

  return authorization === `Bearer ${expectedSecret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await reminderDeliveryService.dispatchDueReminders()

  return NextResponse.json(result)
}
