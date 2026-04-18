import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { githubRepositoryService } from '@/lib/github/repositories'
import { githubWorkflowsService } from '@/lib/github/workflows'
import prisma from '@/lib/prisma'

function getValidatedPage(value?: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function getValidatedPerPage(value?: string | null, fallback = 20, max = 100) {
  const perPage = Number(value)
  if (!Number.isInteger(perPage) || perPage <= 0) {
    return fallback
  }

  return Math.min(perPage, max)
}

function getValidatedWorkflowId(value?: string | null) {
  const workflowId = Number(value)
  return Number.isInteger(workflowId) && workflowId > 0 ? workflowId : undefined
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
  const page = getValidatedPage(searchParams.get('page'))
  const perPage = getValidatedPerPage(searchParams.get('perPage'))
  const workflowId = getValidatedWorkflowId(searchParams.get('workflowId'))
  const branch = searchParams.get('branch')?.trim() || undefined
  const status = searchParams.get('status')?.trim() || undefined

  try {
    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, {
        owner,
        repo,
      })

    const runs = await githubWorkflowsService.listRepositoryWorkflowRuns({
      userId: user.id,
      owner: validatedRepository.owner,
      repo: validatedRepository.repo,
      page,
      perPage,
      workflowId,
      branch,
      status,
    })

    return NextResponse.json({
      runs,
      pagination: {
        page,
        perPage,
        hasNextPage: runs.length === perPage,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to list GitHub workflow runs'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
