'use client'

import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, BellRing } from 'lucide-react'
import Link from 'next/link'

import { ReminderForm } from '@/components/dashboard/github/reminder-form'
import { SectionHeader } from '@/components/dashboard/section-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useIssueReminder } from '@/hooks/use-reminders'

export function IssueReminderPage({
  owner,
  repo,
  issueNumber,
}: {
  owner: string
  repo: string
  issueNumber: number
}) {
  const repository = `${owner}/${repo}`
  const { data: existingReminder, isLoading } = useIssueReminder(
    repository,
    issueNumber
  )

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow={`${repository} • Issue #${issueNumber}`}
        title="Reminder"
        description="Set when SyncHub should follow up on this issue. If a reminder already exists, the form below will load it so you can update it."
        actions={
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/issues/${owner}/${repo}/${issueNumber}`}>
              <ArrowLeft className="size-4" />
              Back to issue
            </Link>
          </Button>
        }
      />

      <Card className="max-w-3xl border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="size-5 text-emerald-600 dark:text-emerald-300" />
            Reminder settings
          </CardTitle>
          <CardDescription>
            SyncHub will deliver this reminder to your linked chat apps once it becomes due.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="glass-surface rounded-3xl px-4 py-4 transition-all duration-300">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Current status
            </p>
            {isLoading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Checking for an existing reminder...
              </div>
            ) : existingReminder ? (
              <>
                <p className="mt-2 text-lg font-semibold">Pending reminder found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Scheduled{' '}
                  {formatDistanceToNow(new Date(existingReminder.remindAt), {
                    addSuffix: true,
                  })}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-lg font-semibold">No reminder yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Save one below and SyncHub will keep the latest pending reminder for this issue.
                </p>
              </>
            )}
          </div>

          <ReminderForm repository={repository} issueNumber={issueNumber} />
        </CardContent>
      </Card>
    </div>
  )
}
