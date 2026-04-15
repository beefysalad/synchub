import { counterService } from '@/lib/services/counter-service'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const counter = await counterService.GetGlobalCounter()
    return NextResponse.json(counter)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch counter' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const counter = await counterService.incrementGlobalCounter()
    return NextResponse.json(counter)
  } catch {
    return NextResponse.json(
      { error: 'Failed to increment counter' },
      { status: 500 }
    )
  }
}
