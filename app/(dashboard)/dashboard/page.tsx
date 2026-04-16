import { auth } from '@clerk/nextjs/server'
import { formatDistanceToNow } from 'date-fns'
import { BellRing, FolderGit2, Link2, Plus, Star } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SectionHeader } from '@/components/dashboard/section-header'
import { StatusCard } from '@/components/dashboard/status-card'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { githubIssueService } from '@/lib/github/issues'
import type { GitHubIssue } from '@/lib/github/types'
import prisma from '@/lib/prisma'

export default async function DashboardPage() {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      trackedRepos: {
        where: { isDefault: true },
        take: 1,
      },
    },
  })

  if (!user) {
    redirect('/sign-in')
  }

  const [trackedReposCount, pendingRemindersCount, linkedAccounts] =
    await Promise.all([
      prisma.trackedRepo.count({ where: { userId: user.id } }),
      prisma.reminder.count({ where: { userId: user.id, status: 'PENDING' } }),
      prisma.linkedAccount.findMany({
        where: { userId: user.id },
        select: { provider: true },
      }),
    ])

  const defaultRepo = user.trackedRepos[0]
  let recentIssues: GitHubIssue[] = []
  let defaultOwner = ''
  let defaultRepoName = ''

  if (defaultRepo) {
    const [owner, repo] = defaultRepo.fullName.split('/')
    defaultOwner = owner
    defaultRepoName = repo
    try {
      const issues = await githubIssueService.listRepositoryIssues({
        userId: user.id,
        owner,
        repo,
        state: 'open',
      })
      recentIssues = issues.slice(0, 3)
    } catch (error) {
      // Gracefully handle integration errors or missing tokens without breaking the layout
      console.error('Failed to fetch dashboard issues:', error)
    }
  }

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
        eyebrow="Control Plane"
        title="SyncHub Dashboard"
        description="Your unified view of tracked repositories, active reminders, and recent issues requiring triage."
        actions={
          <>
            <Button asChild className="rounded-full">
              <Link href="/integrations">Manage integrations</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/issues">Review tracked repos</Link>
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
        <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Recent Issues</CardTitle>
              <CardDescription>
                {defaultRepo
                  ? `Most recent open issues in ${defaultRepo.fullName}.`
                  : 'Set a default repository to view recent issues here.'}
              </CardDescription>
            </div>
            {defaultRepo ? (
              <Button asChild variant="outline" className="rounded-full">
                <Link href={`/issues/${defaultOwner}/${defaultRepoName}/new`}>
                  <Plus className="size-4" />
                  New issue
                </Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {!defaultRepo ? (
              <div className="text-muted-foreground rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm dark:border-slate-700">
                You haven&apos;t designated a default repository yet. Head over
                to your tracked repositories and set one to display its recent
                activity here.
              </div>
            ) : recentIssues.length ? (
              recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-3xl border border-slate-200/70 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-950">
                          #{issue.number}
                        </span>
                        <p className="font-semibold">{issue.title}</p>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Opened by {issue.user.login}{' '}
                        {formatDistanceToNow(new Date(issue.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="shrink-0 rounded-full"
                    >
                      <Link
                        href={`/issues/${defaultOwner}/${defaultRepoName}/${issue.number}`}
                      >
                        Open issue
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm dark:border-slate-700">
                No recent open issues found in this repository.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
