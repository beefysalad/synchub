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
  labels: Array<{
    id: number
    name: string
    color: string
  }>
  assignees: Array<{
    id: number
    login: string
  }>
  user: {
    login: string
    avatar_url: string
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
}

export type CreateGitHubIssueResponse = {
  issue: GitHubIssue
}

export type GitHubIssueDetailResponse = {
  issue: GitHubIssue
  comments: GitHubIssueComment[]
}

export type GitHubPullRequest = {
  id: number
  number: number
  state: 'open' | 'closed'
  title: string
  body: string | null
  created_at: string
  html_url: string
  user: {
    login: string
    avatar_url: string
  }
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

export type GitHubCommitsResponse = {
  commits: GitHubCommit[]
}
