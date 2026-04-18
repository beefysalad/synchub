import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { githubPullsService } from '@/lib/github/pulls'
import { githubRepositoryService } from '@/lib/github/repositories'
import prisma from '@/lib/prisma'

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

  try {
    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, {
        owner,
        repo,
      })

    const template = await githubPullsService.getPullRequestTemplate(
      user.id,
      validatedRepository.owner,
      validatedRepository.repo
    )

    return NextResponse.json(template)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to fetch pull request template'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
