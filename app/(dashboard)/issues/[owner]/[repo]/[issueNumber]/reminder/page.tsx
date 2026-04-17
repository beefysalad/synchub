import IssueReminderPage from '@/components/page/issues/issue-reminder-page'

type PageProps = {
  params: Promise<{
    owner: string
    repo: string
    issueNumber: string
  }>
}

export default function Page(props: PageProps) {
  return <IssueReminderPage {...props} />
}
