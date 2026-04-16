import { IssueReminderPage } from '@/components/dashboard/github/issue-reminder-page'

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
