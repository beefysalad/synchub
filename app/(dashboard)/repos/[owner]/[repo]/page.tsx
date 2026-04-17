import RepositoryIssuesRoute from '@/components/page/repos/repository-issues-page'

type PageProps = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export default function Page(props: PageProps) {
  return <RepositoryIssuesRoute {...props} />
}
