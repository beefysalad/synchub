import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { githubIssueService } from '@/lib/github/issues'
import prisma from '@/lib/prisma'

function getRedirectUrl(request: NextRequest) {
  const referer = request.headers.get('referer')

  if (referer) {
    return new URL(referer)
  }

  return new URL('/issues', request.url)
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

  const formData = await request.formData()
  const owner = String(formData.get('owner') ?? '')
  const repo = String(formData.get('repo') ?? '')
  const title = String(formData.get('title') ?? '')
  const body = String(formData.get('body') ?? '')
  const labels = formData
    .getAll('labels')
    .map((value) => String(value).trim())
    .filter(Boolean)
  const redirectUrl = getRedirectUrl(request)

  redirectUrl.searchParams.set('owner', owner)
  redirectUrl.searchParams.set('repo', repo)

  try {
    if (!owner || !repo || !title.trim()) {
      throw new Error('Owner, repo, and title are required.')
    }

    const issue = await githubIssueService.createIssue({
      userId: user.id,
      owner,
      repo,
      title: title.trim(),
      body: body.trim() || undefined,
      labels,
    })

    redirectUrl.searchParams.set('created', String(issue.number))

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    redirectUrl.searchParams.set(
      'error',
      error instanceof Error ? error.message : 'Unable to create issue'
    )

    return NextResponse.redirect(redirectUrl)
  }
}
