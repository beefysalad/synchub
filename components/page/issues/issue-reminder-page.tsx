import { IssueReminderPage } from '@/components/page/issues/components/issue-reminder-screen'

export default async function Page({
  params,
}: {
  params: Promise<{ owner: string; repo: string; issueNumber: string }>
}) {
  const { owner, repo, issueNumber } = await params

  return (
    <IssueReminderPage
      owner={owner}
      repo={repo}
      issueNumber={parseInt(issueNumber, 10)}
    />
  )
}
