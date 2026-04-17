'use client'

import * as React from 'react'
import { PanelLeft, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SidebarContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, _setOpen] = React.useState(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)

  // Persist open state
  React.useEffect(() => {
    const saved = localStorage.getItem('sidebar:open')
    if (saved !== null) {
      _setOpen(saved === 'true')
    }
  }, [])

  const setOpen = React.useCallback((value: boolean) => {
    _setOpen(value)
    localStorage.setItem('sidebar:open', String(value))
  }, [])

  const toggleSidebar = React.useCallback(() => {
    if (window.innerWidth < 768) {
      setOpenMobile(!openMobile)
    } else {
      setOpen(!open)
    }
  }, [open, openMobile, setOpen])

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [open, openMobile, toggleSidebar, setOpen]
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)

  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider.')
  }

  return context
}

export function SidebarTrigger({
  className,
}: {
  className?: string
}) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={cn(className)}
      onClick={toggleSidebar}
    >
      <PanelLeft className="size-4" />
      <span className="sr-only">Toggle navigation</span>
    </Button>
  )
}

export function Sidebar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { open, openMobile, setOpenMobile } = useSidebar()

  return (
    <>
      <aside
        className={cn(
          'app-sidebar-surface sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r transition-[width] duration-300 ease-in-out md:flex',
          open ? 'w-72' : 'w-[72px]',
          className
        )}
      >
        {children}
      </aside>

      {openMobile ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setOpenMobile(false)}
          />
          <aside className="app-sidebar-surface relative z-10 flex h-full w-[min(86vw,20rem)] flex-col border-r">
            <div className="flex justify-end px-3 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpenMobile(false)}
              >
                <X className="size-4" />
                <span className="sr-only">Close navigation</span>
              </Button>
            </div>
            {children}
          </aside>
        </div>
      ) : null}
    </>
  )
}

export function SidebarHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { open } = useSidebar()
  return (
    <div
      className={cn(
        'border-b border-white/50 px-4 py-4 transition-all duration-300 dark:border-white/10',
        !open && 'px-2.5',
        className
      )}
    >
      {children}
    </div>
  )
}

export function SidebarContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { open } = useSidebar()
  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto px-3 py-4 transition-all duration-300',
        !open && 'px-2',
        className
      )}
    >
      {children}
    </div>
  )
}

export function SidebarFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { open } = useSidebar()
  return (
    <div
      className={cn(
        'border-t border-white/50 px-4 py-4 transition-all duration-300 dark:border-white/10',
        !open && 'px-2',
        className
      )}
    >
      {children}
    </div>
  )
}

export function SidebarInset({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('min-w-0 flex-1', className)}>{children}</div>
}

