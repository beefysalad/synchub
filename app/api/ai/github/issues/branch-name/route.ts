import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { githubAssistantService } from '@/lib/ai/github-assistant'
import prisma from '@/lib/prisma'

const branchSuggestionRequestSchema = z.object({
  repository: z.string().trim().regex(/^[^/]+\/[^/]+$/),
  issueNumber: z.number().int().positive(),
  title: z.string().trim().min(5),
  body: z.string().trim().optional().default(''),
  comments: z
    .array(
      z.object({
        author: z.string().trim().min(1),
        body: z.string(),
        createdAt: z.string().trim().min(1),
      })
    )
    .default([]),
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
    const body = branchSuggestionRequestSchema.parse(await request.json())
    const suggestions = await githubAssistantService.suggestBranchNames({
      userId: user.id,
      ...body,
    })

    return NextResponse.json(suggestions)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to suggest branch names'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
