'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { BellPlus } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useCreateReminder, useIssueReminder } from '@/hooks/use-reminders'
import {
  createReminderSchema,
  type CreateReminderValues,
} from '@/lib/validators/reminder'

function getDefaultReminderDate() {
  const nextHour = new Date()
  nextHour.setHours(nextHour.getHours() + 1)
  nextHour.setMinutes(0, 0, 0)

  const timezoneOffset = nextHour.getTimezoneOffset()
  const localDate = new Date(nextHour.getTime() - timezoneOffset * 60 * 1000)

  return localDate.toISOString().slice(0, 16)
}

export function ReminderForm({
  repository,
  issueNumber,
}: {
  repository: string
  issueNumber: number
}) {
  const createReminder = useCreateReminder()
  const {
    data: existingReminder,
    isLoading: isExistingReminderLoading,
  } = useIssueReminder(repository, issueNumber)
  const form = useForm<CreateReminderValues>({
    resolver: zodResolver(createReminderSchema),
    defaultValues: {
      repository,
      issueNumber,
      remindAt: getDefaultReminderDate(),
      note: '',
    },
  })

  useEffect(() => {
    if (existingReminder) {
      const remindAt = new Date(existingReminder.remindAt)
      const timezoneOffset = remindAt.getTimezoneOffset()
      const localDate = new Date(remindAt.getTime() - timezoneOffset * 60 * 1000)

      form.reset({
        repository,
        issueNumber,
        remindAt: localDate.toISOString().slice(0, 16),
        note: existingReminder.note ?? '',
      })
      return
    }

    form.reset({
      repository,
      issueNumber,
      remindAt: getDefaultReminderDate(),
      note: '',
    })
  }, [existingReminder, form, issueNumber, repository])

  async function onSubmit(values: CreateReminderValues) {
    try {
      await createReminder.mutateAsync({
        repository: values.repository,
        issueNumber: values.issueNumber,
        remindAt: new Date(values.remindAt).toISOString(),
        note: values.note,
      })
      toast.success(
        existingReminder
          ? `Reminder updated for issue #${issueNumber}.`
          : `Reminder set for issue #${issueNumber}.`
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to create reminder'
      )
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {isExistingReminderLoading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-muted-foreground dark:border-slate-700">
          Loading current reminder...
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="remindAt">
          Remind me at
        </label>
        <input
          id="remindAt"
          type="datetime-local"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-emerald-500/40 dark:focus:ring-emerald-500/20"
          {...form.register('remindAt')}
        />
        {form.formState.errors.remindAt ? (
          <p className="text-sm text-red-600 dark:text-red-300">
            {form.formState.errors.remindAt.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="note">
          Note
        </label>
        <textarea
          id="note"
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-emerald-500/40 dark:focus:ring-emerald-500/20"
          placeholder="Optional context for the reminder"
          {...form.register('note')}
        />
        {form.formState.errors.note ? (
          <p className="text-sm text-red-600 dark:text-red-300">
            {form.formState.errors.note.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className="rounded-full"
        disabled={createReminder.isPending}
      >
        {createReminder.isPending ? (
          <>
            <Spinner />
            Saving...
          </>
        ) : (
          <>
            <BellPlus className="size-4" />
            {existingReminder ? 'Update reminder' : 'Save reminder'}
          </>
        )}
      </Button>
    </form>
  )
}
