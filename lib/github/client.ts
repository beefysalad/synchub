import prisma from '@/lib/prisma'

const GITHUB_API_URL = 'https://api.github.com'

export async function getGitHubAccessTokenForUser(userId: string) {
  const account = await prisma.linkedAccount.findFirst({
    where: {
      userId,
      provider: 'GITHUB',
    },
  })

  return account?.accessToken ?? null
}

export async function githubRequest<T>(
  path: string,
  init: RequestInit,
  accessToken: string
) {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SyncHub',
      ...init.headers,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`GitHub API error (${response.status}): ${errorBody}`)
  }

  return (await response.json()) as T
}
