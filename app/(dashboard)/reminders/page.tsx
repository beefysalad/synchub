import { BellRing, CalendarClock, Send, ShieldCheck } from 'lucide-react'

import { SectionHeader } from '@/components/dashboard/section-header'
import { StatusCard } from '@/components/dashboard/status-card'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function RemindersPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Reminders"
        title="Notification scaffolding for issue follow-up"
        description="Reminder persistence is part of the initial Prisma design so scheduling can be added later without reshaping the data model."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={CalendarClock}
          label="Storage"
          value="Ready"
          detail="Reminder records store repository, issue number, schedule time, and lifecycle status."
        />
        <StatusCard
          icon={BellRing}
          label="Dispatch"
          value="Planned"
          detail="Chat notification delivery will plug into Telegram and Discord once scheduling is live."
        />
        <StatusCard
          icon={Send}
          label="Digests"
          value="Future"
          detail="Daily summaries and team digests are documented as follow-on enhancements."
        />
        <StatusCard
          icon={ShieldCheck}
          label="Safety"
          value="Explicit"
          detail="Reminder state is modeled directly to support retries, cancellations, and audits."
        />
      </div>

      <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <CardTitle>Implementation note</CardTitle>
          <CardDescription>
            A queue is optional for this phase. The current architecture keeps
            reminders simple enough to start with cron or Vercel scheduled jobs.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          That approach is usually enough for a solo developer until webhook
          traffic and reminder volume justify introducing a queue such as
          Upstash Redis.
        </CardContent>
      </Card>
    </div>
  )
}
