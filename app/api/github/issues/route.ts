import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { githubRepositoryService } from '@/lib/github/repositories'
import prisma from '@/lib/prisma'
import { githubIssueService } from '@/lib/github/issues'
import { buildIssueLabels } from '@/lib/github/issue-templates'
import { githubIssueFormSchema } from '@/lib/validators/github-issue'

function getValidatedIssueState(state?: string | null): 'open' | 'closed' | 'all' {
  if (state === 'closed' || state === 'all') {
    return state
  }

  return 'open'
}

const createGithubIssueRequestSchema = githubIssueFormSchema
  .pick({
    template: true,
    title: true,
    body: true,
  })
  .extend({
  owner: z.string().trim().min(1, 'Owner is required.'),
  repo: z.string().trim().min(1, 'Repository is required.'),
  labels: z.array(z.string().trim().min(1)).max(5).optional(),
  })

function getValidatedPage(value?: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function getValidatedPerPage(value?: string | null, fallback = 12, max = 50) {
  const perPage = Number(value)
  if (!Number.isInteger(perPage) || perPage <= 0) {
    return fallback
  }

  return Math.min(perPage, max)
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
  const page = getValidatedPage(searchParams.get('page'))
  const perPage = getValidatedPerPage(searchParams.get('perPage'))
  const label = searchParams.get('label')?.trim() || undefined

  try {
    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, {
        owner,
        repo,
      })
    const validatedState = getValidatedIssueState(state)

    const issues = await githubIssueService.listRepositoryIssues({
      userId: user.id,
      owner: validatedRepository.owner,
      repo: validatedRepository.repo,
      state: validatedState,
      page,
      perPage,
      label,
    })

    return NextResponse.json({
      issues,
      pagination: {
        page,
        perPage,
        hasNextPage: issues.length === perPage,
      },
    })
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

  try {
    const body = createGithubIssueRequestSchema.parse(await request.json())

    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, {
        owner: body.owner,
        repo: body.repo,
      })

    const issue = await githubIssueService.createIssue({
      userId: user.id,
      owner: validatedRepository.owner,
      repo: validatedRepository.repo,
      title: body.title,
      body: body.body,
      labels: buildIssueLabels(body.template, body.labels),
    })

    return NextResponse.json({ issue }, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to create GitHub issue'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
