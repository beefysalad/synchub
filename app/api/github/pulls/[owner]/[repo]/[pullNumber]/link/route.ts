import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { githubIssueService } from '@/lib/github/issues'
import { githubPullIssueLinkService } from '@/lib/github/pull-issue-links'
import { githubPullsService } from '@/lib/github/pulls'
import { githubRepositoryService } from '@/lib/github/repositories'
import prisma from '@/lib/prisma'

const linkPullIssueSchema = z.object({
  issueNumber: z.number().int().positive(),
})

export async function POST(
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

  try {
    const { owner, repo, pullNumber } = await params
    const { issueNumber } = linkPullIssueSchema.parse(await request.json())

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

    await githubIssueService.getIssue(
      user.id,
      validatedRepository.owner,
      validatedRepository.repo,
      issueNumber
    )

    const linkedIssues = await githubPullIssueLinkService.linkPullRequestToIssues({
      userId: user.id,
      pullOwner: validatedRepository.owner,
      pullRepo: validatedRepository.repo,
      pull,
      issues: [
        {
          owner: validatedRepository.owner,
          repo: validatedRepository.repo,
          number: issueNumber,
          fullName: `${validatedRepository.owner}/${validatedRepository.repo}`,
        },
      ],
    })

    return NextResponse.json({ linkedIssues })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to link pull request to issue'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
