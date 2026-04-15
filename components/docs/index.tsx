import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  BookOpen,
  Boxes,
  Code2,
  Database,
  FileText,
  Github,
  GitMerge,
  LifeBuoy,
  Palette,
  Rocket,
  Server,
  ShieldCheck,
  Terminal,
  Wrench,
} from 'lucide-react'
import Link from 'next/link'
import ApiRoutes from './api-routes'
import Architecture from './architecture'
import Authentication from './authentication'
import Components from './components'
import DatabaseComponent from './database'
import Deployment from './deployment'
import Forms from './forms'
import GettingStarted from './getting-started'
import Styling from './styling'
import Troubleshooting from './troubleshooting'
import Usage from './usage'
import Workflows from './workflows'

const DocsComponent = () => {
  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white dark:bg-neutral-950 dark:text-neutral-50 dark:selection:bg-neutral-50 dark:selection:text-neutral-900">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 flex items-center justify-between">
          <Link href="/">
            <Button
              variant="ghost"
              className="gap-2 rounded-full border border-zinc-200 bg-zinc-50 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <ArrowLeft className="size-4" />
              Back to Home
            </Button>
          </Link>
          <ThemeToggle />
        </div>

        <div className="space-y-20">
          <header className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm font-medium dark:border-neutral-800 dark:bg-neutral-900/50">
              <BookOpen className="size-4" />
              <span>Developer Guide</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
              Next.js Prisma Template
            </h1>
            <p className="max-w-3xl text-xl leading-relaxed text-zinc-600 dark:text-neutral-400">
              A high-performance, full-stack boilerplate designed for speed and
              reliability. Built with Next.js 16, Prisma 7, and Clerk.
            </p>
          </header>

          <nav className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
            <h2 className="mb-6 text-xl font-bold">Quick Navigation</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <a
                href="#getting-started"
                className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <Terminal className="size-4" />
                Getting Started
              </a>
              <a
                href="#authentication"
                className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <ShieldCheck className="size-4" />
                Authentication
              </a>
              <a
                href="#workflows"
                className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <GitMerge className="size-4" />
                Workflows
              </a>
              <a
                href="#usage"
                className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <LifeBuoy className="size-4" />
                Using this Template
              </a>
              <a
                href="#architecture"
                className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <Boxes className="size-4" />
                Architecture
              </a>
              <a
                href="#api-routes"
                className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <Server className="size-4" />
                API Routes
              </a>
              <a
                href="#database"
                className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <Database className="size-4" />
                Database & Prisma
              </a>
              <a
                href="#components"
                className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <Code2 className="size-4" />
                Components
              </a>
              <a
                href="#styling"
                className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <Palette className="size-4" />
                Styling Guide
              </a>
              <a
                href="#forms"
                className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <FileText className="size-4" />
                Forms & Validation
              </a>
              <a
                href="#deployment"
                className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <Rocket className="size-4" />
                Deployment
              </a>
              <a
                href="#troubleshooting"
                className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <Wrench className="size-4" />
                Troubleshooting
              </a>
            </div>
          </nav>

          <GettingStarted />

          <Authentication />

          <Workflows />

          <Usage />

          <Architecture />

          <ApiRoutes />

          <DatabaseComponent />

          <Components />

          <Styling />

          <Forms />

          <Deployment />

          <Troubleshooting />

          <section className="space-y-8 border-t border-zinc-200 pt-16 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500 text-white">
                <Github className="size-5" />
              </div>
              <h2 className="text-3xl font-bold">Contributors</h2>
            </div>
            <p className="text-zinc-600 dark:text-neutral-400">
              Shoutout to everyone below for contributing to this boilerplate!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="https://github.com/beefysalad"
                target="_blank"
                className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 transition-all hover:border-zinc-900 hover:bg-white dark:border-neutral-800 dark:bg-neutral-900/30 dark:hover:border-neutral-50 dark:hover:bg-neutral-900"
              >
                <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
                  <img
                    src="/ptrck.jpg"
                    alt="beefysalad"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold">beefysalad</div>
                  <div className="text-xs text-zinc-500">Main Contributor</div>
                </div>
              </Link>
            </div>
          </section>

          <footer className="flex flex-col items-center justify-between gap-6 border-t border-zinc-200 pt-12 text-center md:flex-row md:text-left dark:border-neutral-800">
            <Link
              href="https://github.com/beefysalad/next-prisma-template"
              target="_blank"
            >
              <Button className="rounded-full px-8 font-bold">
                Star on GitHub :3
              </Button>
            </Link>
            <p className="text-sm text-zinc-500">
              Built by{' '}
              <Link
                href="https://patr1ck.dev"
                className="underline underline-offset-4"
                target="_blank"
              >
                patr1ck.dev
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default DocsComponent
