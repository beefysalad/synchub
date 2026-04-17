import { IssueDetailPage } from '@/components/page/issues/components/issue-detail-screen'

export default async function Page({
  params,
}: {
  params: Promise<{ owner: string; repo: string; issueNumber: string }>
}) {
  const { owner, repo, issueNumber } = await params

  return (
    <IssueDetailPage
      owner={owner}
      repo={repo}
      issueNumber={parseInt(issueNumber, 10)}
    />
  )
}
