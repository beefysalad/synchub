import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { githubIssueService } from '@/lib/github/issues'
import { githubPullIssueLinkService } from '@/lib/github/pull-issue-links'
import { githubPullsService } from '@/lib/github/pulls'
import { githubRepositoryService } from '@/lib/github/repositories'
import prisma from '@/lib/prisma'

const linkPullIssueSchema = z.object({
  issueNumber: z.number().int().positive().optional(),
  issueNumbers: z.array(z.number().int().positive()).min(1).optional(),
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
    const { issueNumber, issueNumbers } = linkPullIssueSchema.parse(
      await request.json()
    )
    const normalizedIssueNumbers = Array.from(
      new Set(issueNumbers ?? (issueNumber ? [issueNumber] : []))
    )

    if (!normalizedIssueNumbers.length) {
      throw new Error('Select at least one issue to link.')
    }

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

    await Promise.all(
      normalizedIssueNumbers.map((currentIssueNumber) =>
        githubIssueService.getIssue(
          user.id,
          validatedRepository.owner,
          validatedRepository.repo,
          currentIssueNumber
        )
      )
    )

    const linkedIssues = await githubPullIssueLinkService.linkPullRequestToIssues({
      userId: user.id,
      pullOwner: validatedRepository.owner,
      pullRepo: validatedRepository.repo,
      pull,
      issues: normalizedIssueNumbers.map((currentIssueNumber) => ({
        owner: validatedRepository.owner,
        repo: validatedRepository.repo,
        number: currentIssueNumber,
        fullName: `${validatedRepository.owner}/${validatedRepository.repo}`,
      })),
    })

    return NextResponse.json({ linkedIssues })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to link pull request to issues'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
