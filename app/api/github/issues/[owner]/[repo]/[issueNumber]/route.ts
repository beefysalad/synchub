import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { githubRepositoryService } from '@/lib/github/repositories'
import prisma from '@/lib/prisma'
import { githubIssueService } from '@/lib/github/issues'
import { githubThreadEditSchema } from '@/lib/validators/github-thread'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; issueNumber: string }> }
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

  const { owner, repo, issueNumber } = await params

  try {
    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, {
        owner,
        repo,
      })

    const issue = await githubIssueService.getIssue(
      user.id,
      validatedRepository.owner,
      validatedRepository.repo,
      parseInt(issueNumber, 10)
    )

    const comments = await githubIssueService.getIssueComments(
      user.id,
      validatedRepository.owner,
      validatedRepository.repo,
      parseInt(issueNumber, 10)
    )

    return NextResponse.json({ issue, comments })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to fetch GitHub issue'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; issueNumber: string }> }
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

  const { owner, repo, issueNumber } = await params

  try {
    const body = await request.json()
    const hasEditFields =
      typeof body.title === 'string' || typeof body.body === 'string'

    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, {
        owner,
        repo,
      })

    const issue = hasEditFields
      ? await githubIssueService.updateIssue({
          userId: user.id,
          owner: validatedRepository.owner,
          repo: validatedRepository.repo,
          issueNumber: parseInt(issueNumber, 10),
          ...githubThreadEditSchema.parse({
            title: body.title,
            body: body.body,
          }),
        })
      : await githubIssueService.updateIssueState(
          user.id,
          validatedRepository.owner,
          validatedRepository.repo,
          parseInt(issueNumber, 10),
          body.state === 'closed' ? 'closed' : 'open'
        )

    return NextResponse.json({ issue })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to update GitHub issue'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; issueNumber: string }> }
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

  const { owner, repo, issueNumber } = await params

  try {
    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, {
        owner,
        repo,
      })

    await githubIssueService.deleteIssue(
      user.id,
      validatedRepository.owner,
      validatedRepository.repo,
      parseInt(issueNumber, 10)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    // If the error contains something related to permission, surface it cleanly.
    const message =
      error instanceof Error ? error.message : 'Unable to delete GitHub issue'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
