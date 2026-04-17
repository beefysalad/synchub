'use client'

import {
  BellRing,
  FileText,
  FolderGit2,
  Github,
  LayoutDashboard,
  Link2,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { DashboardUserControls } from '@/components/dashboard/dashboard-user-controls'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/integrations', label: 'Integrations', icon: Link2 },
  { href: '/repos', label: 'Repositories', icon: FolderGit2 },
  { href: '/reminders', label: 'Reminders', icon: BellRing },
  { href: '/summary', label: 'Daily Summary', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
  const pathname = usePathname()
  const { open, setOpenMobile } = useSidebar()

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href="/dashboard"
          className={cn(
            'flex items-start gap-3 transition-all duration-300',
            !open && 'justify-center gap-0'
          )}
        >
          <span className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all duration-300">
            <Github className="size-5" />
          </span>
          <div
            className={cn(
              'min-w-0 transition-all duration-300',
              open ? 'opacity-100' : 'w-0 overflow-hidden opacity-0'
            )}
          >
            <div className="text-foreground text-sm font-semibold tracking-tight">
              SyncHub
            </div>
            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
              A calmer workspace for GitHub issues.
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <div className="space-y-6">
          <div>
            <p
              className={cn(
                'text-muted-foreground/75 px-3 text-[11px] font-semibold tracking-[0.22em] uppercase transition-all duration-300',
                !open && 'h-0 overflow-hidden opacity-0'
              )}
            >
              Workspace
            </p>
            <nav className={cn('space-y-1.5', !open ? 'mt-0' : 'mt-3')}>
              {navigation.map(({ href, label, icon: Icon }) => {
                const active = isActivePath(pathname, href)

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpenMobile(false)}
                    title={!open ? label : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
                      open
                        ? active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/70 dark:hover:bg-white/5'
                        : 'mx-auto flex size-14 items-center justify-center rounded-full px-0 py-0'
                    )}
                  >
                    {open ? (
                      <>
                        <Icon className="size-4 shrink-0" />
                        <span className="opacity-100 transition-all duration-300">
                          {label}
                        </span>
                      </>
                    ) : (
                      <span
                        className={cn(
                          'flex size-14 items-center justify-center rounded-full transition-all duration-300',
                          active
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/70 dark:hover:bg-white/5'
                        )}
                      >
                        <Icon className="size-5 shrink-0" />
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <DashboardUserControls />
      </SidebarFooter>
    </Sidebar>
  )
}
