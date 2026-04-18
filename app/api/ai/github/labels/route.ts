import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { githubAssistantService } from '@/lib/ai/github-assistant'
import { githubIssueService } from '@/lib/github/issues'
import { githubRepositoryService } from '@/lib/github/repositories'
import prisma from '@/lib/prisma'

const labelSuggestionRequestSchema = z.object({
  owner: z.string().trim().min(1),
  repo: z.string().trim().min(1),
  template: z.string().trim().min(1),
  title: z.string().trim().min(5),
  body: z.string().trim().min(20),
})

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
    const body = labelSuggestionRequestSchema.parse(await request.json())
    const validatedRepository =
      await githubRepositoryService.resolveRepositoryContext(user.id, {
        owner: body.owner,
        repo: body.repo,
      })

    const availableLabels = await githubIssueService.listRepositoryLabels(
      user.id,
      validatedRepository.owner,
      validatedRepository.repo
    )

    const suggestions = await githubAssistantService.suggestIssueLabels({
      userId: user.id,
      repository: `${validatedRepository.owner}/${validatedRepository.repo}`,
      availableLabels: availableLabels.map((label) => label.name),
      template: body.template,
      title: body.title,
      body: body.body,
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to suggest labels'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
