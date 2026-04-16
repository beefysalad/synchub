import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { githubIssueService } from '@/lib/github/issues'
import { githubRepositoryService } from '@/lib/github/repositories'
import prisma from '@/lib/prisma'

const querySchema = z.object({
  owner: z.string().trim().min(1),
  repo: z.string().trim().min(1),
})

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

  try {
    const params = querySchema.parse({
      owner: request.nextUrl.searchParams.get('owner'),
      repo: request.nextUrl.searchParams.get('repo'),
    })

    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, params)

    const users = await githubIssueService.listAssignableUsers(
      user.id,
      validatedRepository.owner,
      validatedRepository.repo
    )

    return NextResponse.json({ users })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to fetch assignable users'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
