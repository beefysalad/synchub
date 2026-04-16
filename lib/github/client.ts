import { createExternalApi, getAxiosErrorMessage } from '@/lib/axios'
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
  try {
    const response = await createExternalApi({
      baseURL: GITHUB_API_URL,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'SyncHub',
        ...(init.headers as Record<string, string> | undefined),
      },
    }).request<T>({
      url: path,
      method: init.method as
        | 'GET'
        | 'POST'
        | 'PUT'
        | 'PATCH'
        | 'DELETE'
        | undefined,
      data: init.body,
    })

    return response.data
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, 'GitHub API error'))
  }
}
