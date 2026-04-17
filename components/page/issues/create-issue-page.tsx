import { CreateGithubIssuePage } from '@/components/page/issues/components/create-github-issue-screen'

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
