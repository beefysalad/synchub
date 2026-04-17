import RepositorySettingsPage from '@/components/page/repos/repository-settings-page'

type PageProps = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export default function Page(props: PageProps) {
  return <RepositorySettingsPage {...props} />
}
