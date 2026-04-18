'use client'

import { MessageSquarePlus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export function GitHubCommentForm({
  isPending,
  onSubmit,
}: {
  isPending: boolean
  onSubmit: (body: string) => Promise<void> | void
}) {
  const [body, setBody] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedBody = body.trim()
    if (!normalizedBody) {
      return
    }

    await onSubmit(normalizedBody)
    setBody('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-surface space-y-4 rounded-3xl px-4 py-4 transition-all duration-300"
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold">Add a comment</p>
        <p className="text-muted-foreground text-sm">
          Post a Markdown comment directly to GitHub without leaving this page.
        </p>
      </div>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={5}
        placeholder="Share feedback, ask a question, or leave implementation notes..."
        className="placeholder:text-muted-foreground border-border bg-background focus:border-primary/50 focus:ring-primary/20 w-full rounded-3xl border px-4 py-3 text-sm shadow-sm transition-all outline-none focus:ring-2"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          Markdown is supported.
        </p>
        <Button
          type="submit"
          className="rounded-full"
          disabled={isPending || !body.trim()}
        >
          {isPending ? (
            <>
              <Spinner />
              Posting...
            </>
          ) : (
            <>
              <MessageSquarePlus className="size-4" />
              Post comment
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
