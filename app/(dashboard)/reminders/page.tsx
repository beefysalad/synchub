'use client'

import { formatDistanceToNow } from 'date-fns'
import { BellRing, CalendarClock, Clock3, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

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
import { Spinner } from '@/components/ui/spinner'
import { useReminders, useUpdateReminder } from '@/hooks/use-reminders'
import type { ReminderRecord, ReminderStatus } from '@/lib/reminders/types'

const reminderStatuses: Array<ReminderStatus | 'ALL'> = [
  'ALL',
  'PENDING',
  'SENT',
  'FAILED',
  'CANCELED',
]

function ReminderCard({
  reminder,
}: {
  reminder: ReminderRecord
}) {
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

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-950">
              #{reminder.issueNumber}
            </span>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-300">
              {reminder.status}
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold">{reminder.repository}</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Reminds {formatDistanceToNow(new Date(reminder.remindAt), { addSuffix: true })}
            </p>
          </div>
          {reminder.note ? (
            <p className="text-sm text-muted-foreground">{reminder.note}</p>
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
        </div>
      </div>
    </div>
  )
}

export default function RemindersPage() {
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | 'ALL'>('ALL')
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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
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
          value={String(reminders.filter((reminder) => reminder.status === 'PENDING').length)}
          detail="Still scheduled for future delivery."
        />
        <StatusCard
          icon={Clock3}
          label="Delivered"
          value={String(reminders.filter((reminder) => reminder.status === 'SENT').length)}
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

      <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Reminder queue</CardTitle>
            <CardDescription>
              Create reminders from issue detail pages, then manage the full queue here.
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
            <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm text-muted-foreground dark:border-slate-700">
              Loading reminders...
            </div>
          ) : reminders.length ? (
            reminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm text-muted-foreground dark:border-slate-700">
              No reminders yet. Open an issue and create a reminder from its detail page.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
