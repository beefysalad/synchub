import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import {
  ArrowRight,
  Bot,
  Github,
  LayoutDashboard,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

const featureCards = [
  {
    icon: Github,
    title: 'Native GitHub Support',
    description:
      'Full issue CRUD operations, label assignments, and repository tracking out of the box.',
  },
  {
    icon: Bot,
    title: 'Chat Integrations',
    description:
      'Seamlessly link Telegram and Discord commands to route issues straight to GitHub.',
  },
  {
    icon: LayoutDashboard,
    title: 'Clean Workspace',
    description:
      'Manage pull requests, commits, and notifications from a lightning fast Next.js dashboard.',
  },
]

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect('/repos')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-50 to-white dark:from-emerald-950/30 dark:via-slate-950 dark:to-slate-950 text-slate-950 dark:text-slate-50 selection:bg-emerald-200 dark:selection:bg-emerald-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        <header className="flex items-center justify-between rounded-full border border-slate-200/50 bg-white/50 px-6 py-4 shadow-sm backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/50">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-emerald-600/30">
              <MessageSquare className="size-5" />
            </span>
            <span className="font-semibold tracking-tight text-lg">SyncHub</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <SignInButton mode="modal" forceRedirectUrl="/repos">
              <Button variant="ghost" className="hidden sm:flex rounded-full text-muted-foreground hover:text-foreground">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/repos">
              <Button className="rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400">
                Get started
              </Button>
            </SignUpButton>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <div className="inline-flex items-center rounded-full border border-emerald-200/50 bg-emerald-50/50 px-4 py-1.5 text-sm font-medium text-emerald-800 dark:border-emerald-800/30 dark:bg-emerald-900/20 dark:text-emerald-300">
            <span className="relative mr-2 flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            Available strictly for power users
          </div>

          <h1 className="mt-8 max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl">
            The command center for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-400">GitHub</span> workflow.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400 sm:text-xl">
            Stop losing track of issues across chat apps. SyncHub maps your Telegram and Discord directly into a premium GitHub workspace.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <SignUpButton mode="modal" forceRedirectUrl="/repos">
              <Button size="lg" className="rounded-full h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-600/20">
                Start syncing now <ArrowRight className="ml-2 size-5" />
              </Button>
            </SignUpButton>
            <SignInButton mode="modal" forceRedirectUrl="/repos">
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900">
                Sign back in
              </Button>
            </SignInButton>
          </div>
        </div>

        <div className="grid gap-6 pb-20 sm:grid-cols-3">
          {featureCards.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center rounded-3xl p-8 transition-colors hover:bg-white/60 dark:hover:bg-slate-900/40 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-800/60"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-emerald-400 mb-6">
                <Icon className="size-6" />
              </div>
              <h3 className="text-lg font-bold tracking-tight mb-3">{title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
