import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { githubAssistantService } from '@/lib/ai/github-assistant'
import prisma from '@/lib/prisma'

const issueSummaryRequestSchema = z.object({
  repository: z.string().trim().regex(/^[^/]+\/[^/]+$/),
  issueNumber: z.number().int().positive(),
  title: z.string().trim().min(1),
  body: z.string().optional().default(''),
  comments: z.array(
    z.object({
      author: z.string().trim().min(1),
      body: z.string().trim().min(1),
      createdAt: z.string().trim().min(1),
    })
  ),
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
    const body = issueSummaryRequestSchema.parse(await request.json())

    const summary = await githubAssistantService.summarizeIssue(body)

    return NextResponse.json(summary)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to summarize issue'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
