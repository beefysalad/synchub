import { CreateGithubIssuePage } from '@/components/dashboard/github/create-github-issue-page'

type CreateGithubIssueRouteProps = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export default async function CreateGithubIssueRoute({
  params,
}: CreateGithubIssueRouteProps) {
  const { owner, repo } = await params

  return <CreateGithubIssuePage owner={owner} repo={repo} />
}
