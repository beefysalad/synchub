import { auth } from '@clerk/nextjs/server'
import {
  BellRing,
  Github,
  LayoutDashboard,
  Link2,
  Settings,
  FolderGit2,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { DashboardUserControls } from '@/components/dashboard/dashboard-user-controls'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/integrations', label: 'Integrations', icon: Link2 },
  { href: '/repos', label: 'Repos', icon: FolderGit2 },
  { href: '/reminders', label: 'Reminders', icon: BellRing },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_rgba(242,247,240,0.96)_0%,_rgba(255,255,255,1)_28%,_rgba(243,246,255,0.9)_100%)] dark:bg-[linear-gradient(180deg,_rgba(6,12,18,1)_0%,_rgba(10,16,28,1)_38%,_rgba(8,12,20,1)_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-3 z-50 rounded-[2rem] border border-white/70 bg-white/85 px-5 py-4 shadow-lg shadow-slate-200/40 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:shadow-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <Github className="size-5" />
                </span>
                <div>
                  <div className="font-semibold tracking-tight">SyncHub</div>
                  <div className="text-sm text-muted-foreground">
                    GitHub issue control plane
                  </div>
                </div>
              </Link>
            </div>

            <nav className="flex flex-wrap gap-2">
              {navigation.map(({ href, label, icon: Icon }) => (
                <Button
                  key={href}
                  asChild
                  variant="ghost"
                  className={cn(
                    'rounded-full px-4 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Link href={href}>
                    <Icon className="size-4" />
                    {label}
                  </Link>
                </Button>
              ))}
            </nav>

            <DashboardUserControls />
          </div>
        </header>

        <div className="relative z-0 flex-1 py-10">{children}</div>
      </div>
    </div>
  )
}
