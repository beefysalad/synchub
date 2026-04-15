import { RepositoryIssuesPage } from '@/components/dashboard/github/repository-issues-page'

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
