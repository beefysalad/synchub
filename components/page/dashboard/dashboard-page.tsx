import { auth } from '@clerk/nextjs/server'
import { formatDistanceToNow } from 'date-fns'
import { BellRing, FileText, FolderGit2, Link2, Plus, Star } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SectionHeader } from '@/components/shared/section-header'
import { StatusCard } from '@/components/shared/status-card'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { dailySummaryService } from '@/lib/services/daily-summary-service'

export default async function DashboardPage() {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      trackedRepos: {
        orderBy: { updatedAt: 'desc' },
      },
    },
  })

  if (!user) {
    redirect('/sign-in')
  }

  const [trackedReposCount, pendingRemindersCount, linkedAccounts] =
    await Promise.all([
      prisma.trackedRepo.count({ where: { userId: user.id } }),
      prisma.reminder.count({
        where: { userId: user.id, status: 'PENDING', archived: false },
      }),
      prisma.linkedAccount.findMany({
        where: { userId: user.id },
        select: { provider: true },
      }),
    ])

  const todaySummary = await prisma.dailySummary.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: dailySummaryService.getDateKey(),
      },
    },
    select: {
      summary: true,
      updatedAt: true,
    },
  })

  const defaultRepo = user.trackedRepos.find(r => r.isDefault)
  const recentRepos = user.trackedRepos.slice(0, 5)

  const integrationNames = linkedAccounts.map((a) =>
    a.provider === 'GITHUB'
      ? 'GitHub'
      : a.provider === 'DISCORD'
        ? 'Discord'
        : a.provider === 'TELEGRAM'
          ? 'Telegram'
          : a.provider
  )

  const activeIntegrationsText = integrationNames.length
    ? `Linked: ${integrationNames.join(', ')}`
    : 'No active integrations'

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Dashboard"
        title="Your GitHub workspace"
        description="See what needs attention, what is already connected, and where your team should pick work up next."
        actions={
          <>
            <Button asChild>
              <Link href="/integrations">Manage integrations</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={FolderGit2}
          label="Tracked Repos"
          value={String(trackedReposCount)}
          detail="Repositories currently synced to your workspace."
        />
        <StatusCard
          icon={BellRing}
          label="Pending Reminders"
          value={String(pendingRemindersCount)}
          detail="Active reminders scheduled for delivery."
        />
        <StatusCard
          icon={Link2}
          label="Integrations"
          value={String(linkedAccounts.length)}
          detail={activeIntegrationsText}
        />
        <StatusCard
          icon={Star}
          label="Default Repo"
          value={defaultRepo ? defaultRepo.fullName : 'None'}
          detail="Your primary repository for triage."
        />
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Daily summary</CardTitle>
              <CardDescription>
                Review today&apos;s briefing in one focused view.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/summary">
                <FileText className="size-4" />
                View daily summary
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todaySummary ? (
              <div className="border-primary/20 bg-primary/10 flex flex-col gap-4 rounded-3xl border px-5 py-5 transition-all duration-300 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground font-semibold">
                      Your daily summary is ready
                    </p>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Updated{' '}
                    {formatDistanceToNow(new Date(todaySummary.updatedAt), {
                      addSuffix: true,
                    })}
                    . Open the dedicated summary page to review the full recap.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground border-border rounded-3xl border border-dashed px-5 py-8 text-sm transition-all duration-300">
                No daily summary has been generated for today yet. When
                it&apos;s ready, you&apos;ll be able to open it from here.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Recent repositories</CardTitle>
              <CardDescription>
                A quick overview of the tracked repositories in your workspace.
              </CardDescription>
            </div>
            {defaultRepo ? (
              <Button asChild variant="outline" className="rounded-full">
                <Link href={`/repos/${defaultRepo.fullName}`}>
                  <FolderGit2 className="size-4 mr-2" />
                  View default repo
                </Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {!recentRepos.length ? (
              <div className="text-muted-foreground rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm dark:border-slate-700">
                You haven&apos;t tracked any repositories yet. Head over to workspace controls to track repositories and view them here.
              </div>
            ) : (
              <div className="grid gap-3">
                {recentRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="glass-surface rounded-2xl px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{repo.fullName}</span>
                        {repo.isDefault && <Star className="size-3.5 text-primary fill-current" />}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Last tracked {formatDistanceToNow(new Date(repo.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                    
                    <Button
                      asChild
                      variant="secondary"
                      className="shrink-0 rounded-full shadow-sm text-xs h-8"
                    >
                      <Link href={`/repos/${repo.fullName}`}>
                        Open workspace
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
