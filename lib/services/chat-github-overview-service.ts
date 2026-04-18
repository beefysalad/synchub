import { githubIssueService } from '@/lib/github/issues'
import { githubPullsService } from '@/lib/github/pulls'
import { githubRepositoryService } from '@/lib/github/repositories'

function parseRepositoryInput(repository?: string | null) {
  const normalized = repository?.trim()

  if (!normalized) {
    return null
  }

  const [owner, repo] = normalized.split('/')

  if (!owner || !repo) {
    throw new Error('Repository must be provided in the format owner/repo.')
  }

  return { owner, repo }
}

export const chatGithubOverviewService = {
  async getOpenIssuesSummary({
    userId,
    repository,
  }: {
    userId: string
    repository?: string | null
  }) {
    const explicitRepository = parseRepositoryInput(repository)
    const resolved = await githubRepositoryService.resolveRepositoryContext(
      userId,
      explicitRepository ?? undefined
    )
    const issues = await githubIssueService.listRepositoryIssues({
      userId,
      owner: resolved.owner,
      repo: resolved.repo,
      state: 'open',
      perPage: 5,
    })

    if (!issues.length) {
      return [
        `Open issues for ${resolved.fullName}:`,
        'No open issues found right now.',
      ].join('\n')
    }

    return [
      `Open issues for ${resolved.fullName}:`,
      ...issues.map((issue) => `• #${issue.number} ${issue.title}`),
    ].join('\n')
  },

  async getOpenPullsSummary({
    userId,
    repository,
  }: {
    userId: string
    repository?: string | null
  }) {
    const explicitRepository = parseRepositoryInput(repository)
    const resolved = await githubRepositoryService.resolveRepositoryContext(
      userId,
      explicitRepository ?? undefined
    )
    const pulls = await githubPullsService.listRepositoryPulls({
      userId,
      owner: resolved.owner,
      repo: resolved.repo,
      state: 'open',
      perPage: 5,
    })

    if (!pulls.length) {
      return [
        `Open pull requests for ${resolved.fullName}:`,
        'No open pull requests found right now.',
      ].join('\n')
    }

    return [
      `Open pull requests for ${resolved.fullName}:`,
      ...pulls.map((pull) => `• #${pull.number} ${pull.title}`),
    ].join('\n')
  },
}
