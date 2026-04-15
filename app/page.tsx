import { Show, SignInButton, SignUpButton } from '@clerk/nextjs'
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Github,
  LayoutDashboard,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const featureCards = [
  {
    icon: Github,
    title: 'GitHub-native workflows',
    description:
      'Prepare authenticated GitHub issue operations with room for additional scopes, comments, labels, and assignees.',
  },
  {
    icon: Bot,
    title: 'Telegram and Discord linking',
    description:
      'Single-use tokens and slash-command flows let teams connect chat accounts without leaking credentials.',
  },
  {
    icon: LayoutDashboard,
    title: 'A focused operator dashboard',
    description:
      'Keep integrations, issues, reminders, and system health in one place without adding a separate backend framework.',
  },
]

const phaseHighlights = [
  'Phase 1: Clerk + GitHub identity sync',
  'Phase 2: Telegram deep-link account linking',
  'Phase 3: Discord slash command linking',
  'Phase 4: GitHub issue CRUD',
  'Phase 5+: reminders, webhooks, and AI enhancements',
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(21,128,61,0.18),_transparent_34%),linear-gradient(180deg,_#f7f8f2_0%,_#ffffff_42%,_#f2f5ff_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(74,222,128,0.16),_transparent_30%),linear-gradient(180deg,_#071112_0%,_#09121f_38%,_#070b14_100%)] dark:text-slate-50">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
              <MessageSquare className="size-5" />
            </span>
            <span className="text-lg">SyncHub</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <Button variant="outline" className="rounded-full">
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <Button className="rounded-full">Start building</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Button asChild className="rounded-full">
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Show>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/80 px-4 py-2 text-sm text-emerald-900 shadow-sm backdrop-blur dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
              <CheckCircle2 className="size-4" />
              Production-oriented GitHub issue assistant for chat-first teams
            </div>

            <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
              Keep GitHub issues moving from Telegram, Discord, and one clean control plane.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              SyncHub gives solo builders and small teams a pragmatic way to
              link identities, route chat commands into GitHub, and monitor the
              system from a lightweight Next.js dashboard.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Show when="signed-out">
                <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                  <Button size="lg" className="rounded-full">
                    Create your workspace
                  </Button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/integrations">Manage integrations</Link>
                </Button>
              </Show>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="/login">Sign in with Clerk</Link>
              </Button>
            </div>
          </div>

          <Card className="border-white/60 bg-white/70 shadow-2xl shadow-slate-300/30 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-emerald-950/20">
            <CardHeader>
              <CardTitle className="text-xl">Delivery plan at a glance</CardTitle>
              <CardDescription>
                The starter now includes the schema, routes, docs, and UI
                scaffolding for incremental implementation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {phaseHighlights.map((highlight) => (
                <div
                  key={highlight}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200"
                >
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>{highlight}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 pb-10 md:grid-cols-3">
          {featureCards.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="border-white/60 bg-white/70 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/60"
            >
              <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-emerald-500 dark:text-slate-950">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
