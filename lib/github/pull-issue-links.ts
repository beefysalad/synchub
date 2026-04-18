import { githubPullsService } from '@/lib/github/pulls'
import type {
  GitHubIssueReference,
  GitHubPullRequest,
} from '@/lib/github/types'

const MANAGED_LINK_BLOCK_START = '<!-- synchub-linked-issues:start -->'
const MANAGED_LINK_BLOCK_END = '<!-- synchub-linked-issues:end -->'
const CLOSING_KEYWORD_PATTERN =
  '(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)'

function buildIssueReference(owner: string, repo: string, number: number): GitHubIssueReference {
  return {
    owner,
    repo,
    number,
    fullName: `${owner}/${repo}`,
  }
}

function normalizeRepositoryNameSegment(value: string) {
  return value.trim().replace(/[^A-Za-z0-9_.-]/g, '')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildClosingReference(
  pullOwner: string,
  pullRepo: string,
  issue: GitHubIssueReference
) {
  const issueReference =
    issue.owner === pullOwner && issue.repo === pullRepo
      ? `#${issue.number}`
      : `${issue.owner}/${issue.repo}#${issue.number}`

  return `Closes ${issueReference}`
}

function hasClosingReference({
  body,
  pullOwner,
  pullRepo,
  issue,
}: {
  body: string
  pullOwner: string
  pullRepo: string
  issue: GitHubIssueReference
}) {
  const sameRepoReference = `#${issue.number}`
  const crossRepoReference = `${issue.owner}/${issue.repo}#${issue.number}`
  const references =
    issue.owner === pullOwner && issue.repo === pullRepo
      ? [sameRepoReference, crossRepoReference]
      : [crossRepoReference]

  return references.some((reference) => {
    const pattern = new RegExp(
      `\\b${CLOSING_KEYWORD_PATTERN}\\b[\\s:]+${escapeRegExp(reference)}\\b`,
      'i'
    )

    return pattern.test(body)
  })
}

function stripManagedLinkBlock(body: string) {
  if (!body.includes(MANAGED_LINK_BLOCK_START)) {
    return body.trimEnd()
  }

  const pattern = new RegExp(
    `\\n*${escapeRegExp(MANAGED_LINK_BLOCK_START)}[\\s\\S]*?${escapeRegExp(
      MANAGED_LINK_BLOCK_END
    )}\\n*`,
    'g'
  )

  return body.replace(pattern, '\n\n').trimEnd()
}

function buildManagedLinkBlock(references: string[]) {
  return [
    MANAGED_LINK_BLOCK_START,
    ...references,
    MANAGED_LINK_BLOCK_END,
  ].join('\n')
}

function withManagedLinkBlock(body: string | null | undefined, references: string[]) {
  const baseBody = stripManagedLinkBlock(body ?? '')

  if (!references.length) {
    return baseBody
  }

  const managedBlock = buildManagedLinkBlock(references)

  return baseBody ? `${baseBody}\n\n${managedBlock}` : managedBlock
}

export function extractIssueReferencesFromPullRequest({
  owner,
  repo,
  title,
  body,
  pullNumber,
}: {
  owner: string
  repo: string
  title?: string | null
  body?: string | null
  pullNumber?: number
}) {
  const text = `${title ?? ''}\n${body ?? ''}`
  const references = new Map<string, GitHubIssueReference>()

  const crossRepoPattern = /\b([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)#(\d+)\b/g
  for (const match of text.matchAll(crossRepoPattern)) {
    const refOwner = normalizeRepositoryNameSegment(match[1] ?? '')
    const refRepo = normalizeRepositoryNameSegment(match[2] ?? '')
    const refNumber = Number(match[3])

    if (!refOwner || !refRepo || Number.isNaN(refNumber)) {
      continue
    }

    if (pullNumber && refOwner === owner && refRepo === repo && refNumber === pullNumber) {
      continue
    }

    const reference = buildIssueReference(refOwner, refRepo, refNumber)
    references.set(`${reference.fullName}#${reference.number}`, reference)
  }

  const sameRepoPattern = /(^|[^A-Za-z0-9_./-])#(\d+)\b/g
  for (const match of text.matchAll(sameRepoPattern)) {
    const refNumber = Number(match[2])

    if (Number.isNaN(refNumber)) {
      continue
    }

    if (pullNumber && refNumber === pullNumber) {
      continue
    }

    const reference = buildIssueReference(owner, repo, refNumber)
    references.set(`${reference.fullName}#${reference.number}`, reference)
  }

  return Array.from(references.values())
}

export function extractLikelyIssueFromBranchName({
  owner,
  repo,
  branchName,
  pullNumber,
}: {
  owner: string
  repo: string
  branchName?: string | null
  pullNumber?: number
}) {
  if (!branchName) {
    return null
  }

  const match = branchName.match(/(?:^|[/-])(\d+)(?:[/-]|$)/)

  if (!match) {
    return null
  }

  const issueNumber = Number(match[1])

  if (Number.isNaN(issueNumber) || issueNumber <= 0) {
    return null
  }

  if (pullNumber && issueNumber === pullNumber) {
    return null
  }

  return buildIssueReference(owner, repo, issueNumber)
}

type LinkPullRequestToIssuesInput = {
  userId: string
  pullOwner: string
  pullRepo: string
  pull: Pick<GitHubPullRequest, 'number' | 'title' | 'body' | 'html_url'>
  issues: GitHubIssueReference[]
}

export const githubPullIssueLinkService = {
  extractIssueReferencesFromPullRequest,
  extractLikelyIssueFromBranchName,

  async linkPullRequestToIssues({
    userId,
    pullOwner,
    pullRepo,
    pull,
    issues,
  }: LinkPullRequestToIssuesInput) {
    if (!issues.length) {
      return []
    }

    const pullBody = pull.body ?? ''
    let existingManagedIssues: GitHubIssueReference[] = []
    const blockStartIdx = pullBody.indexOf(MANAGED_LINK_BLOCK_START)
    const blockEndIdx = pullBody.indexOf(MANAGED_LINK_BLOCK_END)
    
    if (blockStartIdx !== -1 && blockEndIdx !== -1 && blockStartIdx < blockEndIdx) {
      const managedBlockContent = pullBody.slice(blockStartIdx, blockEndIdx)
      existingManagedIssues = extractIssueReferencesFromPullRequest({
        owner: pullOwner,
        repo: pullRepo,
        body: managedBlockContent,
        pullNumber: pull.number
      })
    }

    const combinedIssues = [...existingManagedIssues, ...issues]

    const uniqueIssues = Array.from(
      new Map(
        combinedIssues.map((issue) => [`${issue.fullName}#${issue.number}`, issue])
      ).values()
    )

    const bodyWithoutManagedLinks = stripManagedLinkBlock(pullBody)
    const managedReferences = uniqueIssues
      .filter(
        (issue) =>
          !hasClosingReference({
            body: bodyWithoutManagedLinks,
            pullOwner,
            pullRepo,
            issue,
          })
      )
      .map((issue) => buildClosingReference(pullOwner, pullRepo, issue))

    const nextBody = withManagedLinkBlock(pull.body, managedReferences)

    if (nextBody !== pullBody) {
      await githubPullsService.updatePullRequest({
        userId,
        owner: pullOwner,
        repo: pullRepo,
        pullNumber: pull.number,
        title: pull.title,
        body: nextBody,
      })
    }

    return uniqueIssues
  },

  async unlinkPullRequestFromIssues({
    userId,
    pullOwner,
    pullRepo,
    pull,
    issuesToUnlink,
  }: LinkPullRequestToIssuesInput & { issuesToUnlink: GitHubIssueReference[] }) {
    if (!issuesToUnlink.length) {
      return []
    }

    const pullBody = pull.body ?? ''
    const blockStartIdx = pullBody.indexOf(MANAGED_LINK_BLOCK_START)
    const blockEndIdx = pullBody.indexOf(MANAGED_LINK_BLOCK_END)
    
    if (blockStartIdx === -1 || blockEndIdx === -1 || blockStartIdx >= blockEndIdx) {
      return []
    }

    const managedBlockContent = pullBody.slice(blockStartIdx, blockEndIdx)
    const existingManagedIssues = extractIssueReferencesFromPullRequest({
      owner: pullOwner,
      repo: pullRepo,
      body: managedBlockContent,
      pullNumber: pull.number
    })

    const remainingIssues = existingManagedIssues.filter(
      (ref) => !issuesToUnlink.some((u) => u.fullName === ref.fullName && u.number === ref.number)
    )

    const bodyWithoutManagedLinks = stripManagedLinkBlock(pullBody)
    const managedReferences = remainingIssues
      .filter(
        (issue) =>
          !hasClosingReference({
            body: bodyWithoutManagedLinks,
            pullOwner,
            pullRepo,
            issue,
          })
      )
      .map((issue) => buildClosingReference(pullOwner, pullRepo, issue))

    const nextBody = withManagedLinkBlock(pull.body, managedReferences)

    if (nextBody !== pullBody) {
      await githubPullsService.updatePullRequest({
        userId,
        owner: pullOwner,
        repo: pullRepo,
        pullNumber: pull.number,
        title: pull.title,
        body: nextBody,
      })
    }

    return remainingIssues
  },
}
