import { RepositorySettingsPage } from '@/components/dashboard/github/repository-settings'

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
