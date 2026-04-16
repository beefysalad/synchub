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

export type GitHubRepositoriesResponse = {
  repositories: GitHubRepository[]
  preferences: GitHubRepositoryPreferences
}

export type GitHubIssuesResponse = {
  issues: GitHubIssue[]
}

export type GitHubIssueState = 'open' | 'closed' | 'all'

export type UpdateGitHubPreferencesPayload = {
  defaultRepository?: string | null
  selectedRepositories?: string[]
}

export type CreateGitHubIssuePayload = {
  owner: string
  repo: string
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
  user: {
    login: string
    avatar_url: string
  }
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
}

export type GitHubPullDetailResponse = {
  pull: GitHubPullRequest
  comments: GitHubIssueComment[]
  detectedIssueReferences: GitHubIssueReference[]
}

export type UpdateGitHubPullPayload = {
  title?: string
  body?: string
}

export type GitHubCommitsResponse = {
  commits: GitHubCommit[]
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

export type GithubIssueDraftResponse = {
  body: string
}

export type GithubDailySummaryResponse = {
  headline: string
  overview: string
  insights: string[]
  repositories: Array<{
    repository: string
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
