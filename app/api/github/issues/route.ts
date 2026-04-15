import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { githubIssueService } from '@/lib/github/issues'
import { assertRepositoryInput } from '@/lib/validators/github'

function getValidatedRepository(owner?: string | null, repo?: string | null) {
  assertRepositoryInput(owner, repo)

  if (!owner || !repo) {
    throw new Error('Both "owner" and "repo" are required.')
  }

  return { owner, repo }
}

function getValidatedIssueState(state?: string | null): 'open' | 'closed' | 'all' {
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
    const validatedRepository = getValidatedRepository(owner, repo)
    const validatedState = getValidatedIssueState(state)

    const issues = await githubIssueService.listRepositoryIssues({
      userId: user.id,
      owner: validatedRepository.owner,
      repo: validatedRepository.repo,
      state: validatedState,
    })

    return NextResponse.json({ issues })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to list GitHub issues'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
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

  const body = (await request.json()) as {
    owner?: string
    repo?: string
    title?: string
    body?: string
  }

  try {
    const validatedRepository = getValidatedRepository(body.owner, body.repo)

    if (!body.title) {
      throw new Error('A title is required to create an issue.')
    }

    const issue = await githubIssueService.createIssue({
      userId: user.id,
      owner: validatedRepository.owner,
      repo: validatedRepository.repo,
      title: body.title,
      body: body.body,
    })

    return NextResponse.json({ issue }, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to create GitHub issue'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
