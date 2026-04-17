import CreateIssuePage from '@/components/page/issues/create-issue-page'

type PageProps = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export default function Page(props: PageProps) {
  return <CreateIssuePage {...props} />
}
