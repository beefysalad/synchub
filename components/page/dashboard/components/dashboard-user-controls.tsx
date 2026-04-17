'use client'

import { UserButton } from '@clerk/nextjs'

import { ThemeToggle } from '@/components/theme-toggle'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export function DashboardUserControls() {
  const { open } = useSidebar()

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        open ? 'justify-between' : 'flex-col'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3',
          open ? 'min-w-0 flex-1' : 'flex-col'
        )}
      >
        <UserButton
          appearance={{
            elements: {
              avatarBox:
                'size-10 ring-1 ring-black/8 dark:ring-white/10 shadow-sm',
            },
          }}
        />
        <div
          className={cn(
            'min-w-0 transition-all duration-300',
            open ? 'opacity-100' : 'hidden'
          )}
        >
          <p className="text-foreground truncate text-sm font-semibold">
            Account
          </p>
          <p className="text-muted-foreground truncate text-xs">
            Profile and sign out
          </p>
        </div>
      </div>
      <ThemeToggle />
    </div>
  )
}
