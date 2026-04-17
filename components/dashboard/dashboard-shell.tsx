'use client'

import { usePathname } from 'next/navigation'

import { AppSidebar } from '@/components/dashboard/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const pageTitles = [
  { prefix: '/dashboard', title: 'Dashboard' },
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
            <div className="mb-8">
              <div className="border-border/60 flex items-center gap-3 border-b px-1 pb-4 transition-all duration-300">
                <SidebarTrigger className="shrink-0 rounded-xl" />
                <div className="min-w-0">
                  <p className="text-muted-foreground text-[10px] font-bold tracking-[0.24em] uppercase transition-all duration-300">
                    Workspace
                  </p>
                  <p className="text-foreground truncate text-base font-semibold tracking-tight transition-all duration-300">
                    {getCurrentTitle(pathname)}
                  </p>
                </div>
              </div>
            </div>

            <main className="flex-1 pb-10">{children}</main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
