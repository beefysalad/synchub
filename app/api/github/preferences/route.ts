import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { githubRepositoryService } from '@/lib/github/repositories'

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
  const fullName = String(formData.get('repository') ?? '')
  const redirectUrl = getRedirectUrl(request)

  try {
    const parsedRepository = githubRepositoryService.parseRepositoryFullName(fullName)

    await githubRepositoryService.saveDefaultRepository(user.id, fullName)

    redirectUrl.searchParams.set('owner', parsedRepository.owner)
    redirectUrl.searchParams.set('repo', parsedRepository.repo)
    redirectUrl.searchParams.set('saved', '1')

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    redirectUrl.searchParams.set(
      'error',
      error instanceof Error ? error.message : 'Unable to save repository'
    )

    return NextResponse.redirect(redirectUrl)
  }
}

const githubPreferencesSchema = z.object({
  defaultRepository: z.string().trim().nullable().optional(),
  selectedRepositories: z.array(z.string().trim()).optional(),
})

export async function PATCH(request: NextRequest) {
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
    const body = githubPreferencesSchema.parse(await request.json())

    if (body.defaultRepository) {
      githubRepositoryService.parseRepositoryFullName(body.defaultRepository)
    }

    body.selectedRepositories?.forEach((repository) => {
      githubRepositoryService.parseRepositoryFullName(repository)
    })

    await githubRepositoryService.savePreferences(user.id, body)

    const preferences = await githubRepositoryService.getPreferences(user.id)

    return NextResponse.json({ preferences })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to save preferences'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
