'use client'

import { formatDistanceToNow } from 'date-fns'
import { BellRing, CalendarClock, Clock3, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

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
import { Spinner } from '@/components/ui/spinner'
import { useReminders, useUpdateReminder } from '@/hooks/use-reminders'
import type { ReminderRecord, ReminderStatus } from '@/lib/reminders/types'

const reminderStatuses: Array<ReminderStatus | 'ALL'> = [
  'ALL',
  'PENDING',
  'SENT',
  'FAILED',
  'CANCELED',
  'ARCHIVED',
]

function ReminderCard({ reminder }: { reminder: ReminderRecord }) {
  const updateReminder = useUpdateReminder(reminder.id)

  function handleCancelReminder() {
    updateReminder.mutate(
      {
        status: 'CANCELED',
      },
      {
        onSuccess: () => {
          toast.success('Reminder canceled.')
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  function handleArchiveReminder() {
    updateReminder.mutate(
      {
        archived: true,
      },
      {
        onSuccess: () => {
          toast.success('Reminder archived.')
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  return (
    <div className="glass-surface rounded-3xl px-5 py-5 transition-all duration-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-all duration-300">
              #{reminder.issueNumber}
            </span>
            <span className="border-border bg-background/50 text-muted-foreground rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider uppercase transition-all duration-300">
              {reminder.status}
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold">{reminder.repository}</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Reminds{' '}
              {formatDistanceToNow(new Date(reminder.remindAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          {reminder.note ? (
            <p className="text-muted-foreground text-sm">{reminder.note}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link
              href={`/issues/${reminder.repository.split('/')[0]}/${reminder.repository.split('/')[1]}/${reminder.issueNumber}`}
            >
              View issue
            </Link>
          </Button>
          {reminder.status === 'PENDING' ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30 dark:hover:text-red-200"
              onClick={handleCancelReminder}
              disabled={updateReminder.isPending}
            >
              {updateReminder.isPending ? (
                <>
                  <Spinner />
                  Canceling...
                </>
              ) : (
                <>
                  <XCircle className="size-4" />
                  Cancel
                </>
              )}
            </Button>
          ) : null}
          {reminder.status === 'SENT' ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={handleArchiveReminder}
              disabled={updateReminder.isPending}
            >
              {updateReminder.isPending ? (
                <>
                  <Spinner />
                  Archiving...
                </>
              ) : (
                'Archive'
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function RemindersPage() {
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | 'ALL'>(
    'ALL'
  )
  const { data, isLoading, error } = useReminders(statusFilter)
  const reminders = data?.reminders ?? []

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Reminders"
        title="Scheduled issue follow-up"
        description="Track pending reminders, review delivered follow-ups, and cancel reminders that no longer matter."
      />

      {error ? (
        <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-2xl border px-5 py-4 text-sm transition-all duration-300">
          {error.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={CalendarClock}
          label="Total reminders"
          value={String(reminders.length)}
          detail="Reminders matching the current status filter."
        />
        <StatusCard
          icon={BellRing}
          label="Pending"
          value={String(
            reminders.filter((reminder) => reminder.status === 'PENDING').length
          )}
          detail="Still scheduled for future delivery."
        />
        <StatusCard
          icon={Clock3}
          label="Delivered"
          value={String(
            reminders.filter((reminder) => reminder.status === 'SENT').length
          )}
          detail="Successfully delivered to your linked channels."
        />
        <StatusCard
          icon={XCircle}
          label="Canceled / failed"
          value={String(
            reminders.filter(
              (reminder) =>
                reminder.status === 'CANCELED' || reminder.status === 'FAILED'
            ).length
          )}
          detail="Reminders that will not send unless you create a new one."
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Reminder queue</CardTitle>
            <CardDescription>
              Create reminders from issue detail pages, then manage the full
              queue here.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {reminderStatuses.map((status) => (
              <Button
                key={status}
                type="button"
                variant={statusFilter === status ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'ALL' ? 'All' : status}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="border-border text-muted-foreground rounded-3xl border border-dashed px-5 py-8 text-sm transition-all duration-300">
              Loading reminders...
            </div>
          ) : reminders.length ? (
            reminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))
          ) : (
            <div className="border-border text-muted-foreground rounded-3xl border border-dashed px-5 py-8 text-sm transition-all duration-300">
              No reminders yet. Open an issue and create a reminder from its
              detail page.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
