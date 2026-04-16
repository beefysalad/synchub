'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Save, X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  githubThreadEditSchema,
  type GitHubThreadEditValues,
} from '@/lib/validators/github-thread'

export function EditGitHubThreadForm({
  initialTitle,
  initialBody,
  isPending,
  onCancel,
  onSubmit,
}: {
  initialTitle: string
  initialBody: string
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: GitHubThreadEditValues) => Promise<void> | void
}) {
  const form = useForm<GitHubThreadEditValues>({
    resolver: zodResolver(githubThreadEditSchema),
    defaultValues: {
      title: initialTitle,
      body: initialBody,
    },
  })

  useEffect(() => {
    form.reset({
      title: initialTitle,
      body: initialBody,
    })
  }, [form, initialBody, initialTitle])

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values)
      })}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Title</label>
        <Input
          {...form.register('title')}
          placeholder="Add a concise title"
          className="rounded-2xl"
        />
        {form.formState.errors.title ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {form.formState.errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Description</label>
        <textarea
          {...form.register('body')}
          rows={10}
          placeholder="Describe the issue or pull request"
          className="min-h-[220px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-950"
        />
        {form.formState.errors.body ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {form.formState.errors.body.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="rounded-full" disabled={isPending}>
          {isPending ? <Spinner /> : <Save className="size-4" />}
          Save changes
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={onCancel}
          disabled={isPending}
        >
          <X className="size-4" />
          Cancel
        </Button>
      </div>
    </form>
  )
}
