import { BellRing, Bot, Github, Link2 } from 'lucide-react'
import Link from 'next/link'

import { SectionHeader } from '@/components/dashboard/section-header'
import { StatusCard } from '@/components/dashboard/status-card'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const activityItems = [
  'Clerk webhook sync creates the user record and mirrors GitHub metadata.',
  'Telegram deep-linking issues a secure single-use token for bot-based linking.',
  'Discord slash-link flow issues a one-time code for `/link <CODE>`.',
  'GitHub issue service scaffolding centralizes future create/list/update logic.',
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Product Overview"
        title="SyncHub Dashboard"
        description="This initial dashboard gives you a production-oriented starting point for identity sync, chat linking, and GitHub issue operations."
        actions={
          <>
            <Button asChild className="rounded-full">
              <Link href="/integrations">Manage integrations</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/issues">Review issue APIs</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={Github}
          label="GitHub access"
          value="Clerk-backed"
          detail="GitHub identity metadata is mirrored from Clerk external accounts into Prisma."
        />
        <StatusCard
          icon={Bot}
          label="Telegram"
          value="Deep-link ready"
          detail="Single-use linking tokens can be minted via the integrations endpoint."
        />
        <StatusCard
          icon={Link2}
          label="Discord"
          value="Slash-link ready"
          detail="The MVP `/link` flow is scaffolded around one-time verification codes."
        />
        <StatusCard
          icon={BellRing}
          label="Reminders"
          value="Schema ready"
          detail="Reminder persistence and scheduling hooks are in place for later phases."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle>System Architecture</CardTitle>
            <CardDescription>
              SyncHub uses Next.js route handlers as the backend surface and
              Prisma as the shared integration store.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Clerk remains the source of truth for web authentication, while
              Prisma stores normalized user, account-linking, and reminder data.
              Chat providers call directly into Next.js API routes, which keeps
              the deployment model simple for a solo developer.
            </p>
            <p>
              GitHub API behavior is intentionally centralized in `lib/github`
              so platform adapters do not need to understand issue semantics.
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle>Implementation Highlights</CardTitle>
            <CardDescription>
              The repo now reflects the phased delivery plan from setup through
              CI/CD.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
