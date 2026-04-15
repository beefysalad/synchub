import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { githubRepositoryService } from '@/lib/github/repositories'
import prisma from '@/lib/prisma'
import { githubPullsService } from '@/lib/github/pulls'
import { githubIssueService } from '@/lib/github/issues'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; pullNumber: string }> }
) {
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

  const { owner, repo, pullNumber } = await params

  try {
    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, {
        owner,
        repo,
      })

    const pull = await githubPullsService.getPullRequest(
      user.id,
      validatedRepository.owner,
      validatedRepository.repo,
      parseInt(pullNumber, 10)
    )

    // Pull Requests use the Issues API for standard thread comments
    const comments = await githubIssueService.getIssueComments(
      user.id,
      validatedRepository.owner,
      validatedRepository.repo,
      parseInt(pullNumber, 10)
    )

    return NextResponse.json({ pull, comments })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to fetch GitHub PR'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
