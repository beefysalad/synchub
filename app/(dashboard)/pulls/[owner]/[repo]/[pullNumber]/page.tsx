import { PullDetailPage } from '@/components/dashboard/github/pull-detail-page'

export default async function Page({
  params,
}: {
  params: Promise<{ owner: string; repo: string; pullNumber: string }>
}) {
  const { owner, repo, pullNumber } = await params

  return (
    <PullDetailPage
      owner={owner}
      repo={repo}
      pullNumber={parseInt(pullNumber, 10)}
    />
  )
}
