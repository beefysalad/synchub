import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { githubRepositoryService } from '@/lib/github/repositories'
import prisma from '@/lib/prisma'
import { githubPullsService } from '@/lib/github/pulls'
import { githubIssueService } from '@/lib/github/issues'
import { githubPullIssueLinkService } from '@/lib/github/pull-issue-links'
import { githubThreadEditSchema } from '@/lib/validators/github-thread'

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

    const detectedIssueReferences =
      githubPullIssueLinkService.extractIssueReferencesFromPullRequest({
        owner: validatedRepository.owner,
        repo: validatedRepository.repo,
        title: pull.title,
        body: pull.body,
        pullNumber: pull.number,
      })

    const likelyLinkedIssue = githubPullIssueLinkService.extractLikelyIssueFromBranchName({
      owner: validatedRepository.owner,
      repo: validatedRepository.repo,
      branchName: pull.head.ref,
      pullNumber: pull.number,
    })

    return NextResponse.json({
      pull,
      comments,
      detectedIssueReferences,
      likelyLinkedIssue,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to fetch GitHub PR'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(
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

    const payload = githubThreadEditSchema.parse(await request.json())

    const pull = await githubPullsService.updatePullRequest({
      userId: user.id,
      owner: validatedRepository.owner,
      repo: validatedRepository.repo,
      pullNumber: parseInt(pullNumber, 10),
      title: payload.title,
      body: payload.body,
    })

    const detectedIssueReferences =
      githubPullIssueLinkService.extractIssueReferencesFromPullRequest({
        owner: validatedRepository.owner,
        repo: validatedRepository.repo,
        title: pull.title,
        body: pull.body,
        pullNumber: pull.number,
      })

    if (detectedIssueReferences.length) {
      await githubPullIssueLinkService.linkPullRequestToIssues({
        userId: user.id,
        pullOwner: validatedRepository.owner,
        pullRepo: validatedRepository.repo,
        pull,
        issues: detectedIssueReferences,
      })

      const refreshedPull = await githubPullsService.getPullRequest(
        user.id,
        validatedRepository.owner,
        validatedRepository.repo,
        parseInt(pullNumber, 10)
      )

      return NextResponse.json({ pull: refreshedPull })
    }

    return NextResponse.json({ pull })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to update GitHub pull request'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
