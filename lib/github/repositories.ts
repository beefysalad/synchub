import type { Prisma } from '@/app/generated/prisma/client'

import prisma from '@/lib/prisma'
import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'
import type {
  GitHubRepository,
  GitHubRepositoryPreferences,
  UpdateGitHubPreferencesPayload,
} from '@/lib/github/types'

function parseRepositoryFullName(fullName: string) {
  const [owner, repo] = fullName.split('/')

  if (!owner || !repo) {
    throw new Error('Repository must be in "owner/repo" format.')
  }

  return { owner, repo }
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
    const trackedRepos = await prisma.trackedRepo.findMany({
      where: { userId },
    })

    const defaultRepo = trackedRepos.find((repo) => repo.isDefault)

    return {
      defaultRepository: defaultRepo ? defaultRepo.fullName : null,
      selectedRepositories: trackedRepos.map((repo) => repo.fullName),
    }
  },

  async savePreferences(
    userId: string,
    updates: UpdateGitHubPreferencesPayload
  ) {
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

    await prisma.$transaction(async (tx) => {
      // 1. Delete stored repositories not in the new selected list for this user
      await tx.trackedRepo.deleteMany({
        where: {
          userId,
          fullName: { notIn: selectedRepositories },
        },
      })

      // 2. Upsert the new list
      for (const repo of selectedRepositories) {
        const isDefault = repo === defaultRepository
        await tx.trackedRepo.upsert({
          where: {
            userId_fullName: {
              userId,
              fullName: repo,
            },
          },
          update: { isDefault },
          create: {
            userId,
            fullName: repo,
            isDefault,
          },
        })
      }
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
