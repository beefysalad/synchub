import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { githubRepositoryService } from '@/lib/github/repositories'

export async function GET() {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    const repositories = await githubRepositoryService.listAccessibleRepositories(
      user.id
    )
    const preferences = await githubRepositoryService.getPreferences(user.id)

    return NextResponse.json({
      repositories,
      preferences,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to list repositories'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
