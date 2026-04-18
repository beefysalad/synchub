import type { GitHubIssueTemplate } from '@/lib/github/issue-templates'

export type GitHubRepository = {
  id: number
  name: string
  full_name: string
  private: boolean
  description: string | null
  html_url: string
  owner: {
    login: string
  }
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  language: string | null
  updated_at: string
}

export type GitHubIssue = {
  id: number
  number: number
  title: string
  state: 'open' | 'closed'
  html_url: string
  body: string | null
  comments: number
  created_at: string
  updated_at: string
  labels: Array<{
    id: number
    name: string
    color: string
  }>
  assignees: Array<{
    id: number
    login: string
    avatar_url: string
  }>
  user: {
    login: string
    avatar_url: string
  }
  pull_request?: {
    html_url: string
  }
}

export type GitHubIssueComment = {
  id: number
  body: string
  created_at: string
  updated_at: string
  user: {
    login: string
    avatar_url: string
  }
}

export type GitHubRepositoryPreferences = {
  defaultRepository: string | null
  selectedRepositories: string[]
}

export type GitHubWorkflow = {
  id: number
  name: string
  state: string
  path: string
  htmlUrl: string
  createdAt: string
  updatedAt: string
  badgeUrl: string | null
}

export type GitHubWorkflowRun = {
  id: number
  workflowId: number
  workflowName: string
  status: string
  conclusion: string | null
  branch: string | null
  actor: {
    login: string
    avatarUrl: string
  } | null
  headSha: string
  headMessage: string | null
  event: string
  runNumber: number
  runAttempt: number
  createdAt: string
  updatedAt: string
  htmlUrl: string
}

export type GitHubRepositoriesResponse = {
  repositories: GitHubRepository[]
  preferences: GitHubRepositoryPreferences
}

export type GitHubWorkflowsResponse = {
  workflows: GitHubWorkflow[]
}

export type GitHubWorkflowRunsResponse = {
  runs: GitHubWorkflowRun[]
  pagination: GitHubPaginationMeta
}

export type GitHubIssuesResponse = {
  issues: GitHubIssue[]
  pagination: GitHubPaginationMeta
}

export type GitHubIssueState = 'open' | 'closed' | 'all'

export type UpdateGitHubPreferencesPayload = {
  defaultRepository?: string | null
  selectedRepositories?: string[]
}

export type CreateGitHubIssuePayload = {
  owner: string
  repo: string
  template: GitHubIssueTemplate
  title: string
  body?: string
  labels?: string[]
}

export type UpdateGitHubIssuePayload = {
  title?: string
  body?: string
  state?: 'open' | 'closed'
  assignees?: string[]
}

export type CreateGitHubIssueResponse = {
  issue: GitHubIssue
}

export type GitHubIssueDetailResponse = {
  issue: GitHubIssue
  comments: GitHubIssueComment[]
  linkedPulls: GitHubPullRequest[]
}

export type GitHubAssignableUser = {
  id: number
  login: string
  avatar_url: string
}

export type GitHubAssignableUsersResponse = {
  users: GitHubAssignableUser[]
}

export type GitHubPullRequest = {
  id: number
  number: number
  state: 'open' | 'closed'
  title: string
  body: string | null
  created_at: string
  updated_at: string
  html_url: string
  head: {
    ref: string
  }
  user: {
    login: string
    avatar_url: string
  }
}

export type GitHubPullFile = {
  sha: string
  filename: string
  status: 'added' | 'removed' | 'modified' | 'renamed' | string
  additions: number
  deletions: number
  changes: number
  blob_url: string
  patch?: string
  previous_filename?: string
}

export type GitHubIssueReference = {
  owner: string
  repo: string
  number: number
  fullName: string
}

export type GitHubCommit = {
  sha: string
  html_url: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
  author: {
    login: string
    avatar_url: string
  } | null
}

export type GitHubPullRequestsResponse = {
  pulls: GitHubPullRequest[]
  pagination: GitHubPaginationMeta
}

export type GitHubPullDetailResponse = {
  pull: GitHubPullRequest
  comments: GitHubIssueComment[]
  files: GitHubPullFile[]
  commits: GitHubCommit[]
  detectedIssueReferences: GitHubIssueReference[]
  likelyLinkedIssue: GitHubIssueReference | null
}

export type UpdateGitHubPullPayload = {
  title?: string
  body?: string
}

export type GitHubCommitsResponse = {
  commits: GitHubCommit[]
  pagination: GitHubPaginationMeta
}

export type GitHubPaginationMeta = {
  page: number
  perPage: number
  hasNextPage: boolean
}

export type GithubLabelSuggestion = {
  label: string
  reason: string
}

export type GithubLabelSuggestionsResponse = {
  suggestions: GithubLabelSuggestion[]
}

export type GithubIssueSummaryResponse = {
  headline: string
  summary: string[]
  risks: string[]
  nextSteps: string[]
}

export type GithubBranchSuggestion = {
  name: string
  reason: string
}

export type GithubBranchSuggestionsResponse = {
  suggestions: GithubBranchSuggestion[]
}

export type GithubIssueDraftResponse = {
  body: string
}

export type GithubDailySummaryRawResponse = {
  headline?: string
  overview?: string
  insights?: string[]
  repositories?: Array<{
    repository?: string
    stats?: {
      commits?: number
      pullRequests?: number
      issues?: number
    }
    highlights?: string[]
  }>
}

export type GithubDailySummaryResponse = {
  headline: string
  overview: string
  insights: string[]
  repositories: Array<{
    repository: string
    stats: {
      commits: number
      pullRequests: number
      issues: number
    }
    highlights: string[]
  }>
}

export type GithubDailySummaryQueryResponse = {
  summary: GithubDailySummaryResponse | null
}

export type GithubDailySummarySendResponse = {
  summary: GithubDailySummaryResponse
  deliveredProviders: Array<'TELEGRAM' | 'DISCORD'>
}
