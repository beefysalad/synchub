'use client'

import { usePathname } from 'next/navigation'

import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { DashboardUserControls } from '@/components/dashboard/dashboard-user-controls'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const pageTitles = [
  { prefix: '/dashboard', title: 'Overview' },
  { prefix: '/integrations', title: 'Integrations' },
  { prefix: '/repos', title: 'Repositories' },
  { prefix: '/issues', title: 'Issues' },
  { prefix: '/pulls', title: 'Pull Requests' },
  { prefix: '/reminders', title: 'Reminders' },
  { prefix: '/summary', title: 'Daily Summary' },
  { prefix: '/settings', title: 'Settings' },
]

function getCurrentTitle(pathname: string) {
  return (
    pageTitles.find((item) => pathname.startsWith(item.prefix))?.title ??
    'SyncHub'
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <div className="app-shell flex min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <div className="mx-auto flex min-h-screen w-full max-w-[1700px] flex-col px-4 py-4 transition-all duration-300 sm:px-6 lg:px-8">
            <div className="glass-surface sticky top-0 z-30 mb-8 flex items-center justify-between rounded-2xl px-4 py-3 shadow-sm transition-all duration-300">
              <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger />
                <div className="min-w-0">
                  <p className="text-muted-foreground/60 text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300">
                    SyncHub
                  </p>
                  <p className="text-foreground truncate text-sm font-semibold transition-all duration-300">
                    {getCurrentTitle(pathname)}
                  </p>
                </div>
              </div>
              <div className="hidden md:block">
                <DashboardUserControls />
              </div>
            </div>

            <main className="flex-1 pb-10">{children}</main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
