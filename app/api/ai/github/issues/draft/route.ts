import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { githubAssistantService } from '@/lib/ai/github-assistant'
import { issueTemplates } from '@/lib/github/issue-templates'
import prisma from '@/lib/prisma'

const issueDraftRequestSchema = z.object({
  repository: z.string().trim().regex(/^[^/]+\/[^/]+$/),
  template: z.enum(Object.keys(issueTemplates) as [keyof typeof issueTemplates, ...(keyof typeof issueTemplates)[]]),
  title: z.string().trim().min(5),
  currentBody: z.string().trim().optional().default(''),
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
    const body = issueDraftRequestSchema.parse(await request.json())
    const draft = await githubAssistantService.draftIssueBody({
      userId: user.id,
      repository: body.repository,
      template: body.template,
      templateBody: issueTemplates[body.template].body,
      title: body.title,
      currentBody: body.currentBody,
    })

    return NextResponse.json(draft)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to generate issue draft'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
