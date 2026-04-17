import { RepositorySettingsPage } from '@/components/page/repos/components/repository-settings-screen'

type Props = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export default async function Page(props: Props) {
  const params = await props.params
  return <RepositorySettingsPage owner={params.owner} repo={params.repo} />
}
