import { getGitHubAccessTokenForUser, githubRequest } from '@/lib/github/client'
import type { GitHubBranch } from '@/lib/github/types'

type GitHubBranchApiResponse = Array<{
  name: string
  protected: boolean
  commit: {
    sha: string
    url: string
  }
}>

type GitHubRepositoryApiResponse = {
  default_branch: string | null
}

export const githubBranchesService = {
  async listRepositoryBranches(
    userId: string,
    owner: string,
    repo: string
  ): Promise<{ branches: GitHubBranch[]; defaultBranch: string | null }> {
    const accessToken = await getGitHubAccessTokenForUser(userId)

    if (!accessToken) {
      throw new Error('No GitHub access token is linked to this user yet.')
    }

    const repository = await githubRequest<GitHubRepositoryApiResponse>(
      `/repos/${owner}/${repo}`,
      { method: 'GET' },
      accessToken
    )

    const branches = await githubRequest<GitHubBranchApiResponse>(
      `/repos/${owner}/${repo}/branches?per_page=100`,
      { method: 'GET' },
      accessToken
    )

    return {
      defaultBranch: repository.default_branch,
      branches: branches.map((branch) => ({
        name: branch.name,
        protected: branch.protected,
        sha: branch.commit.sha,
        htmlUrl: `https://github.com/${owner}/${repo}/tree/${branch.name}`,
      })),
    }
  },
}
