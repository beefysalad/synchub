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
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-500 selection:bg-emerald-200 dark:bg-black dark:text-slate-50 dark:selection:bg-emerald-900/50">
      {/* Light Mode Background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:hidden"></div>
      <div className="absolute top-0 right-0 left-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-emerald-400 opacity-20 blur-[100px] dark:hidden"></div>

      {/* Dark Mode Background: Pulsing neon green */}
      <div className="absolute inset-0 z-0 hidden items-center justify-center dark:flex">
        <div className="h-[40vh] w-[60vw] max-w-[800px] animate-pulse rounded-full bg-emerald-500/10 blur-[120px]"></div>
        <div
          className="absolute h-[25vh] w-[40vw] max-w-[500px] animate-pulse rounded-full bg-emerald-400/15 blur-[100px]"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8">
        <header className="flex items-center justify-between rounded-full border border-slate-200/50 bg-white/70 px-6 py-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/50">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/25">
              <MessageSquare className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              SyncHub
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <SignInButton mode="modal" forceRedirectUrl="/repos">
              <Button
                variant="ghost"
                className="hidden rounded-full font-medium text-slate-600 hover:text-slate-900 sm:flex dark:text-slate-400 dark:hover:text-white"
              >
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/repos">
              <Button className="rounded-full bg-slate-900 font-medium text-white shadow-md hover:bg-slate-800 dark:bg-emerald-500 dark:text-black dark:shadow-emerald-500/20 dark:hover:bg-emerald-400">
                Get started
              </Button>
            </SignUpButton>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400">
            <span>The premier developer workspace</span>
          </div>

          <h1 className="mt-4 max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl">
            The command center for your{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-emerald-200">
              GitHub
            </span>{' '}
            workflow.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl dark:text-zinc-400">
            Stop losing track of issues across chat apps. SyncHub maps your
            Telegram and Discord directly into a premium GitHub workspace.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <SignUpButton mode="modal" forceRedirectUrl="/repos">
              <Button
                size="lg"
                className="group h-14 rounded-full border-0 bg-emerald-600 px-8 text-base font-medium text-white shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 hover:bg-emerald-500 dark:bg-emerald-500 dark:text-black dark:shadow-emerald-500/20 dark:hover:bg-emerald-400"
              >
                Start syncing now{' '}
                <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </SignUpButton>
            <SignInButton mode="modal" forceRedirectUrl="/repos">
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-full border-slate-200 bg-white/50 px-8 text-base font-medium backdrop-blur-sm transition-all hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
              >
                Sign back in
              </Button>
            </SignInButton>
          </div>
        </div>

        <div className="grid gap-6 pb-20 sm:grid-cols-3">
          {featureCards.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group flex flex-col items-center rounded-3xl border border-slate-200/50 bg-white/50 p-8 text-center shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-white/80 hover:shadow-md dark:border-white/5 dark:bg-zinc-900/30 dark:hover:border-emerald-500/30 dark:hover:bg-zinc-900/50"
            >
              <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-zinc-800/50 dark:text-emerald-400 dark:group-hover:bg-emerald-500 dark:group-hover:text-black">
                <Icon className="size-6" />
              </div>
              <h3 className="mb-3 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
