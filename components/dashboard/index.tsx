'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import {
  LayoutDashboard,
  BookOpen,
  ExternalLink,
  Settings,
  Users,
  Calendar,
  Mail,
  TrendingUp,
  FolderTree,
  Container,
  ArrowRight,
} from 'lucide-react'
import { Button } from '../ui/button'
import { WhatsNewModal } from './whats-new-modal'
import { ThemeToggle } from '../theme-toggle'
import { useCounter, useIncrementCounter } from '@/hooks/useCounter'
import { formatDistanceToNow } from 'date-fns'
import type { User } from '@/app/generated/prisma/client'

const projectTree = [
  {
    name: 'app/',
    description: 'App Router pages, layouts, and API routes.',
  },
  {
    name: 'components/',
    description: 'Shared UI, auth flows, docs blocks, and dashboard pieces.',
    children: ['auth/', 'dashboard/', 'docs/', 'landing/', 'ui/'],
  },
  {
    name: 'hooks/',
    description: 'React hooks for auth and counter state.',
  },
  {
    name: 'lib/',
    description: 'API clients, data access, schemas, auth, and utilities.',
    children: ['api/', 'data/', 'schemas/'],
  },
  {
    name: 'prisma/',
    description: 'Schema, migrations, and seed data.',
  },
  {
    name: 'public/',
    description: 'Static assets shipped with the app.',
  },
]

const dockerSteps = [
  'cp .env.example .env',
  'docker compose up --build',
  'open http://localhost:3000',
]

type DashboardComponentProps = {
  user: User | null
}

const DashboardComponent = ({ user }: DashboardComponentProps) => {
  const userName = user?.name || 'Developer'
  const userEmail = user?.email || ''
  const { data: counter, isLoading: counterLoading } = useCounter()
  const incrementMutation = useIncrementCounter()

  const handleIncrement = () => {
    incrementMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-zinc-900 selection:text-white dark:bg-neutral-950 dark:text-neutral-50 dark:selection:bg-neutral-50 dark:selection:text-neutral-900">
      <WhatsNewModal />

      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-950">
              <LayoutDashboard className="size-4" />
            </div>
            <span className="font-bold tracking-tight">:3</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/docs"
              className="flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
            >
              <BookOpen className="size-4" />
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-neutral-800" />
            <ThemeToggle />
            <div className="h-4 w-px bg-zinc-200 dark:bg-neutral-800" />
            <div className="flex h-9 items-center">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox:
                      'size-9 ring-1 ring-zinc-200 dark:ring-neutral-800',
                    userButtonTrigger:
                      'rounded-full focus:shadow-none focus:outline-none',
                    userButtonPopoverCard:
                      'border border-zinc-200 bg-white text-zinc-900 shadow-xl dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome,{' '}
            <span className="text-zinc-500 dark:text-neutral-400">
              {userName}
            </span>
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-neutral-400">
            Everything looks good today. Here&apos;s what you can do next.
          </p>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-900 hover:shadow-xl hover:shadow-zinc-200/50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-50 dark:hover:shadow-none">
            <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-500 transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:bg-neutral-800 dark:text-neutral-400 dark:group-hover:bg-neutral-50 dark:group-hover:text-neutral-900">
              <Users className="size-5" />
            </div>
            <h3 className="mb-4 text-lg font-bold">Your Account</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-zinc-400" />
                <span className="text-zinc-600 dark:text-neutral-400">
                  {userEmail}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 text-zinc-400" />
                <span className="text-zinc-600 dark:text-neutral-400">
                  Member since{' '}
                  {user?.createdAt
                    ? formatDistanceToNow(new Date(user.createdAt), {
                        addSuffix: true,
                      })
                    : 'recently'}
                </span>
              </div>
            </div>
          </div>

          {/* Visitor Counter Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6 transition-all hover:border-zinc-900 hover:shadow-xl hover:shadow-zinc-200/50 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-900/50 dark:hover:border-neutral-50 dark:hover:shadow-none">
            <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950 dark:text-emerald-400 dark:group-hover:bg-emerald-400 dark:group-hover:text-neutral-900">
              <TrendingUp className="size-5" />
            </div>
            <h3 className="mb-2 text-lg font-bold">Global Visitor Count</h3>
            <div className="mb-4">
              <div className="text-4xl font-bold tabular-nums">
                {counterLoading ? (
                  <span className="animate-pulse text-zinc-300 dark:text-neutral-700">
                    ---
                  </span>
                ) : (
                  counter?.value.toLocaleString()
                )}
              </div>
              {counter?.modifiedAt && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-neutral-500">
                  Last updated{' '}
                  {formatDistanceToNow(new Date(counter.modifiedAt), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
            <Button
              onClick={handleIncrement}
              disabled={incrementMutation.isPending}
              className="w-full gap-2 bg-zinc-900 text-white transition-all hover:bg-zinc-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {incrementMutation.isPending
                ? 'Counting...'
                : 'Click to imprint your visit!'}
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
                  <FolderTree className="size-5" />
                </div>
                <h2 className="text-xl font-bold">Project Map</h2>
                <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-neutral-400">
                  A quick read of the folders you&apos;ll touch most often while
                  building on top of this starter.
                </p>
              </div>
              <Link
                href="/docs#architecture"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-900 hover:text-zinc-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-50 dark:hover:text-neutral-50"
              >
                Explore docs
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {projectTree.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-950/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-white p-2 text-zinc-500 shadow-sm dark:bg-neutral-900 dark:text-neutral-400">
                      <FolderTree className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
                          {item.name}
                        </code>
                        {item.children && (
                          <span className="text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-neutral-500">
                            core folders
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-400">
                        {item.description}
                      </p>
                      {item.children && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.children.map((child) => (
                            <span
                              key={child}
                              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                            >
                              {child}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-white shadow-sm dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-800">
            <div className="mb-6 inline-flex size-10 items-center justify-center rounded-2xl bg-white/10">
              <Container className="size-5" />
            </div>
            <h2 className="text-xl font-bold">Docker Quickstart</h2>
            <p className="mt-2 text-sm text-zinc-300">
              The app and PostgreSQL can now boot together in one command,
              with Prisma migrations and seed data applied at startup.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-3 font-mono text-sm">
                {dockerSteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 text-zinc-100"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                      {index + 1}
                    </span>
                    <code className="break-all">{step}</code>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-zinc-400">
              The Compose stack uses a local Postgres container and maps the
              app to port 3000.
            </p>
          </section>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold">Resources</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <DashboardCard
              title="Explore Docs"
              description="Deep dive into the technical architecture and project structure."
              href="/docs"
              icon={<BookOpen className="size-5" />}
            />
            <DashboardCard
              title="Run With Docker"
              description="Start the app and PostgreSQL together with the new Compose setup."
              href="/docs#getting-started"
              icon={<Settings className="size-5" />}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function DashboardCard({
  title,
  description,
  href,
  icon,
  isExternal,
}: {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  isExternal?: boolean
}) {
  return (
    <Link
      href={href}
      target={isExternal ? '_blank' : undefined}
      className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-900 hover:shadow-xl hover:shadow-zinc-200/50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-50 dark:hover:shadow-none"
    >
      <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-500 transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:bg-neutral-800 dark:text-neutral-400 dark:group-hover:bg-neutral-50 dark:group-hover:text-neutral-900">
        {icon}
      </div>
      <h3 className="mb-2 flex items-center gap-2 text-lg font-bold">
        {title}
        {isExternal && <ExternalLink className="size-3 text-zinc-400" />}
      </h3>
      <p className="text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">
        {description}
      </p>
    </Link>
  )
}

export default DashboardComponent
