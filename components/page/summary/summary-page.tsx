import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { ArrowLeft, Settings2 } from 'lucide-react'
import { redirect } from 'next/navigation'

import { DailySummaryCard } from '@/components/page/summary/components/daily-summary-card'
import { SectionHeader } from '@/components/shared/section-header'
import { Button } from '@/components/ui/button'
import prisma from '@/lib/prisma'

export default async function DailySummaryPage() {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  })

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Summary"
        title="Daily Summary"
        description="Review the saved AI recap for today across your tracked repositories. Generation and delivery controls live in Settings."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/dashboard">
                <ArrowLeft className="size-4" />
                Back to dashboard
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/settings">
                <Settings2 className="size-4" />
                Summary settings
              </Link>
            </Button>
          </>
        }
      />

      <DailySummaryCard />
    </div>
  )
}
