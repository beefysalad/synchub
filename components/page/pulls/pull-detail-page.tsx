import { PullDetailPage } from '@/components/page/pulls/components/pull-detail-screen'

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
