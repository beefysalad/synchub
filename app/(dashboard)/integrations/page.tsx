import { Bot, Github, MessageSquareCode } from 'lucide-react'

import { SectionHeader } from '@/components/dashboard/section-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const integrationCards = [
  {
    title: 'GitHub',
    description:
      'GitHub social sign-in is expected to run through Clerk. Metadata from Clerk external accounts is mirrored into Prisma for future issue API access.',
    ctaLabel: 'Configured in Clerk',
    href: 'https://dashboard.clerk.com/',
    icon: Github,
  },
  {
    title: 'Telegram',
    description:
      'Connecting Telegram creates a single-use `PendingLink` token and redirects the user to the bot using a Telegram deep link.',
    ctaLabel: 'Connect Telegram',
    href: '/api/integrations/telegram/start',
    icon: Bot,
  },
  {
    title: 'Discord',
    description:
      'Connecting Discord returns a one-time code for the `/link <CODE>` slash command flow used by the MVP integration.',
    ctaLabel: 'Start Discord link',
    href: '/api/integrations/discord/start',
    icon: MessageSquareCode,
  },
]

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Integrations"
        title="Connect the tools your team already uses"
        description="The account-linking flows are intentionally simple: Clerk for web identity, Telegram deep links for bot linking, and slash-command codes for Discord."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {integrationCards.map(({ title, description, ctaLabel, href, icon: Icon }) => (
          <Card
            key={title}
            className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none"
          >
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <Icon className="size-5" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Each flow stores the external identity in `LinkedAccount`,
                keeping platform-specific details out of the main `User` table.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full rounded-full">
                <a href={href}>{ctaLabel}</a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
