import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { githubRepositoryService } from '@/lib/github/repositories'
import prisma from '@/lib/prisma'
import { githubCommitsService } from '@/lib/github/commits'

function getValidatedPage(value?: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function getValidatedPerPage(value?: string | null, fallback = 10, max = 50) {
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
  const page = getValidatedPage(searchParams.get('page'))
  const perPage = getValidatedPerPage(searchParams.get('perPage'))

  try {
    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, {
        owner,
        repo,
      })

    const commits = await githubCommitsService.listRepositoryCommits({
      userId: user.id,
      owner: validatedRepository.owner,
      repo: validatedRepository.repo,
      page,
      perPage,
    })

    return NextResponse.json({
      commits,
      pagination: {
        page,
        perPage,
        hasNextPage: commits.length === perPage,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to list GitHub commits'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
