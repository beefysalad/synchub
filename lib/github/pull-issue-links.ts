import { githubIssueService } from '@/lib/github/issues'
import type {
  GitHubIssueReference,
  GitHubPullRequest,
} from '@/lib/github/types'

const SYNC_HUB_LINK_MARKER_PREFIX = '<!-- synchub-pr-issue-link:'

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

function buildLinkMarker({
  pullOwner,
  pullRepo,
  pullNumber,
  issueOwner,
  issueRepo,
  issueNumber,
}: {
  pullOwner: string
  pullRepo: string
  pullNumber: number
  issueOwner: string
  issueRepo: string
  issueNumber: number
}) {
  return `${SYNC_HUB_LINK_MARKER_PREFIX}${pullOwner}/${pullRepo}#${pullNumber}|${issueOwner}/${issueRepo}#${issueNumber} -->`
}

function buildPullCommentBody({
  marker,
  issueOwner,
  issueRepo,
  issueNumber,
  issueUrl,
}: {
  marker: string
  issueOwner: string
  issueRepo: string
  issueNumber: number
  issueUrl: string
}) {
  return [
    `Linked issue: [${issueOwner}/${issueRepo}#${issueNumber}](${issueUrl})`,
    '',
    marker,
  ].join('\n')
}

function buildIssueCommentBody({
  marker,
  pullOwner,
  pullRepo,
  pullNumber,
  pullUrl,
}: {
  marker: string
  pullOwner: string
  pullRepo: string
  pullNumber: number
  pullUrl: string
}) {
  return [
    `Linked pull request: [${pullOwner}/${pullRepo}#${pullNumber}](${pullUrl})`,
    '',
    marker,
  ].join('\n')
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

    const uniqueIssues = Array.from(
      new Map(
        issues.map((issue) => [`${issue.fullName}#${issue.number}`, issue])
      ).values()
    )

    const pullComments = await githubIssueService.getIssueComments(
      userId,
      pullOwner,
      pullRepo,
      pull.number
    )

    const linkedIssues: GitHubIssueReference[] = []

    for (const issue of uniqueIssues) {
      const marker = buildLinkMarker({
        pullOwner,
        pullRepo,
        pullNumber: pull.number,
        issueOwner: issue.owner,
        issueRepo: issue.repo,
        issueNumber: issue.number,
      })

      const issueRecord = await githubIssueService.getIssue(
        userId,
        issue.owner,
        issue.repo,
        issue.number
      )
      const issueComments = await githubIssueService.getIssueComments(
        userId,
        issue.owner,
        issue.repo,
        issue.number
      )

      const pullAlreadyLinked = pullComments.some((comment) =>
        comment.body.includes(marker)
      )
      if (!pullAlreadyLinked) {
        await githubIssueService.createIssueComment(
          userId,
          pullOwner,
          pullRepo,
          pull.number,
          buildPullCommentBody({
            marker,
            issueOwner: issue.owner,
            issueRepo: issue.repo,
            issueNumber: issue.number,
            issueUrl: issueRecord.html_url,
          })
        )
      }

      const issueAlreadyLinked = issueComments.some((comment) =>
        comment.body.includes(marker)
      )
      if (!issueAlreadyLinked) {
        await githubIssueService.createIssueComment(
          userId,
          issue.owner,
          issue.repo,
          issue.number,
          buildIssueCommentBody({
            marker,
            pullOwner,
            pullRepo,
            pullNumber: pull.number,
            pullUrl: pull.html_url,
          })
        )
      }

      linkedIssues.push(issue)
    }

    return linkedIssues
  },
}
