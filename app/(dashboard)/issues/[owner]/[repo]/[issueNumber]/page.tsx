import { IssueDetailPage } from '@/components/dashboard/github/issue-detail-page'

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
