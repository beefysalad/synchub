import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { githubRepositoryService } from '@/lib/github/repositories'
import prisma from '@/lib/prisma'
import { githubPullsService } from '@/lib/github/pulls'

function getValidatedState(state?: string | null): 'open' | 'closed' | 'all' {
  if (state === 'closed' || state === 'all') {
    return state
  }

  return 'open'
}

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url)
  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')
  const state = searchParams.get('state')

  try {
    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, {
        owner,
        repo,
      })
    const validatedState = getValidatedState(state)

    const pulls = await githubPullsService.listRepositoryPulls({
      userId: user.id,
      owner: validatedRepository.owner,
      repo: validatedRepository.repo,
      state: validatedState,
    })

    return NextResponse.json({ pulls })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to list GitHub pulls'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
