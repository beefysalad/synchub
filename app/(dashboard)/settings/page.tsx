import { KeyRound, LockKeyhole, Webhook } from 'lucide-react'

import { SectionHeader } from '@/components/dashboard/section-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const settingsItems = [
  {
    icon: KeyRound,
    title: 'Environment variables',
    description:
      'Keep GitHub, Telegram, Discord, Clerk, and database credentials in environment variables only.',
  },
  {
    icon: Webhook,
    title: 'Webhook endpoints',
    description:
      'Expose Clerk, Telegram, and Discord handlers through stable production URLs before enabling external traffic.',
  },
  {
    icon: LockKeyhole,
    title: 'Security posture',
    description:
      'Use signed webhooks, short-lived linking tokens, and least-privilege OAuth scopes as the default policy.',
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Settings"
        title="Operational guidance for a stable rollout"
        description="These settings are documentation-first for now, which keeps the foundation honest while the core integration flows are still being implemented."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {settingsItems.map(({ icon: Icon, title, description }) => (
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
              See `docs/architecture.md` for the system-level trade-offs and the
              phased rollout strategy.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
