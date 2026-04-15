import type { Prisma } from '@/app/generated/prisma/client'

import prisma from '@/lib/prisma'
import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'
import type {
  GitHubRepository,
  GitHubRepositoryPreferences,
  UpdateGitHubPreferencesPayload,
} from '@/lib/github/types'

function getMetadataObject(metadata: unknown) {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : {}
}

function parseRepositoryFullName(fullName: string) {
  const [owner, repo] = fullName.split('/')

  if (!owner || !repo) {
    throw new Error('Repository must be in "owner/repo" format.')
  }

  return { owner, repo }
}

async function getGitHubAccount(userId: string) {
  const account = await prisma.linkedAccount.findFirst({
    where: {
      userId,
      provider: 'GITHUB',
    },
  })

  if (!account) {
    throw new Error('No GitHub account is linked to this user yet.')
  }

  return account
}

export const githubRepositoryService = {
  async listAccessibleRepositories(userId: string) {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    return githubRequest<GitHubRepository[]>(
      '/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member',
      { method: 'GET' },
      accessToken
    )
  },

  async getPreferences(userId: string): Promise<GitHubRepositoryPreferences> {
    const account = await getGitHubAccount(userId)
    const metadata = getMetadataObject(account.metadata)

    return {
      defaultRepository:
        typeof metadata.defaultRepository === 'string'
          ? metadata.defaultRepository
          : null,
      selectedRepositories: Array.isArray(metadata.selectedRepositories)
        ? metadata.selectedRepositories.filter(
            (repository): repository is string => typeof repository === 'string'
          )
        : [],
    }
  },

  async savePreferences(
    userId: string,
    updates: UpdateGitHubPreferencesPayload
  ) {
    const account = await getGitHubAccount(userId)
    const metadata = getMetadataObject(account.metadata)
    const currentPreferences = await this.getPreferences(userId)
    let selectedRepositories =
      updates.selectedRepositories ?? currentPreferences.selectedRepositories
    let defaultRepository =
      updates.defaultRepository === undefined
        ? currentPreferences.defaultRepository
        : updates.defaultRepository

    selectedRepositories = Array.from(
      new Set(
        selectedRepositories.filter((repository) => {
          try {
            parseRepositoryFullName(repository)
            return true
          } catch {
            return false
          }
        })
      )
    )

    if (defaultRepository) {
      parseRepositoryFullName(defaultRepository)
    }

    if (defaultRepository && !selectedRepositories.includes(defaultRepository)) {
      selectedRepositories = [defaultRepository, ...selectedRepositories]
    }

    if (!selectedRepositories.length) {
      defaultRepository = null
    } else if (
      defaultRepository &&
      !selectedRepositories.includes(defaultRepository)
    ) {
      defaultRepository = selectedRepositories[0] ?? null
    }

    const nextMetadata = {
      ...metadata,
      defaultRepository,
      selectedRepositories,
    } as Prisma.InputJsonValue

    return prisma.linkedAccount.update({
      where: {
        id: account.id,
      },
      data: {
        metadata: nextMetadata,
      },
    })
  },

  async saveDefaultRepository(userId: string, fullName: string) {
    const preferences = await this.getPreferences(userId)
    const selectedRepositories = Array.from(
      new Set([...preferences.selectedRepositories, fullName])
    )

    return this.savePreferences(userId, {
      defaultRepository: fullName,
      selectedRepositories,
    })
  },

  async resolveRepositoryContext(
    userId: string,
    repository?: { owner?: string | null; repo?: string | null }
  ) {
    if (repository?.owner && repository?.repo) {
      return {
        owner: repository.owner,
        repo: repository.repo,
        fullName: `${repository.owner}/${repository.repo}`,
      }
    }

    const preferences = await this.getPreferences(userId)

    if (!preferences.defaultRepository && !preferences.selectedRepositories.length) {
      throw new Error(
        'No repository selected. Choose a repository in the dashboard or provide owner/repo explicitly.'
      )
    }

    const fallbackRepository =
      preferences.defaultRepository ?? preferences.selectedRepositories[0]
    const resolved = parseRepositoryFullName(fallbackRepository)

    return {
      ...resolved,
      fullName: fallbackRepository,
    }
  },

  parseRepositoryFullName,
}
