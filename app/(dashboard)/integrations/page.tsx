import IntegrationsPage from '@/components/page/integrations/integrations-page'

type PageProps = {
  searchParams?: Promise<{
    github?: string
    telegramWebhook?: string
    discordCommands?: string
    discordCode?: string
    discordExpiresAt?: string
    discordInstructions?: string
    reason?: string
  }>
}

export default function Page(props: PageProps) {
  return <IntegrationsPage {...props} />
}
