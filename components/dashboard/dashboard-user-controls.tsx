'use client'

import { UserButton } from '@clerk/nextjs'

import { ThemeToggle } from '@/components/theme-toggle'

export function DashboardUserControls() {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'size-9 ring-1 ring-black/8 dark:ring-white/10',
          },
        }}
      />
    </div>
  )
}
