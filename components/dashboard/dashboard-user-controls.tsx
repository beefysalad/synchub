'use client'

import { UserButton } from '@clerk/nextjs'

import { ThemeToggle } from '@/components/theme-toggle'

export function DashboardUserControls() {
  return (
    <div className="flex items-center gap-3 self-end lg:self-auto">
      <ThemeToggle />
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'size-10',
          },
        }}
      />
    </div>
  )
}
