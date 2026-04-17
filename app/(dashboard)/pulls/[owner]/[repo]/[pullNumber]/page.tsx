import PullDetailPage from '@/components/page/pulls/pull-detail-page'

type PageProps = {
  params: Promise<{
    owner: string
    repo: string
    pullNumber: string
  }>
}

export default function Page(props: PageProps) {
  return <PullDetailPage {...props} />
}
