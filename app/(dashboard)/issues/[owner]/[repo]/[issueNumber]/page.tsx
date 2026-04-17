import IssueDetailPage from '@/components/page/issues/issue-detail-page'

type PageProps = {
  params: Promise<{
    owner: string
    repo: string
    issueNumber: string
  }>
}

export default function Page(props: PageProps) {
  return <IssueDetailPage {...props} />
}
