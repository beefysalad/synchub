import { RepositoryIssuesPage } from '@/components/page/repos/components/repository-issues-screen'

type RepositoryIssuesRouteProps = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export default async function RepositoryIssuesRoute({
  params,
}: RepositoryIssuesRouteProps) {
  const { owner, repo } = await params

  return <RepositoryIssuesPage owner={owner} repo={repo} />
}
