'use client'

import { LoaderCircle, Search, UserPlus, X } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import type { GitHubAssignableUser, GitHubIssue } from '@/lib/github/types'

type IssueAssigneesManagerProps = {
  issue: GitHubIssue
  availableUsers: GitHubAssignableUser[]
  isLoadingUsers: boolean
  isSaving: boolean
  onChange: (assignees: string[]) => Promise<void> | void
}

export function IssueAssigneesManager({
  issue,
  availableUsers,
  isLoadingUsers,
  isSaving,
  onChange,
}: IssueAssigneesManagerProps) {
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()
  const assignedLogins = new Set(issue.assignees.map((assignee) => assignee.login))
  const filteredUsers = availableUsers
    .filter((user) => !assignedLogins.has(user.login))
    .filter((user) => user.login.toLowerCase().includes(normalizedQuery))
    .slice(0, 8)

  async function handleRemove(login: string) {
    await onChange(
      issue.assignees
        .filter((assignee) => assignee.login !== login)
        .map((assignee) => assignee.login)
    )
  }

  async function handleAdd(login: string) {
    await onChange([...issue.assignees.map((assignee) => assignee.login), login])
    setQuery('')
  }

  return (
    <div className="glass-surface rounded-3xl px-4 py-4 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Assignees
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep GitHub ownership in sync without leaving SyncHub.
          </p>
        </div>
        {isSaving ? <Spinner className="mt-1 size-4" /> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {issue.assignees.length ? (
          issue.assignees.map((assignee) => (
            <button
              key={assignee.id}
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-red-900/50 dark:hover:bg-red-950/40"
              onClick={() => handleRemove(assignee.login)}
              disabled={isSaving}
              title={`Remove ${assignee.login}`}
            >
              <Image
                src={assignee.avatar_url}
                alt={assignee.login}
                width={20}
                height={20}
                className="size-5 rounded-full"
              />
              <span>{assignee.login}</span>
              <X className="size-3.5" />
            </button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No assignees yet.</p>
        )}
      </div>

      <div className="relative mt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search assignable users"
            className="rounded-full border-slate-200 bg-white pl-9 dark:border-slate-700 dark:bg-slate-950"
            disabled={isSaving || isLoadingUsers}
          />
        </div>

        <div className="mt-3 space-y-2">
          {isLoadingUsers ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading assignable users...
            </div>
          ) : filteredUsers.length ? (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-emerald-900/50 dark:hover:bg-emerald-950/30"
                onClick={() => handleAdd(user.login)}
                disabled={isSaving}
              >
                <span className="flex items-center gap-3">
                  <Image
                    src={user.avatar_url}
                    alt={user.login}
                    width={28}
                    height={28}
                    className="size-7 rounded-full"
                  />
                  <span className="text-sm font-medium text-foreground">
                    {user.login}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                  <UserPlus className="size-3.5" />
                  Add
                </span>
              </button>
            ))
          ) : normalizedQuery ? (
            <p className="text-sm text-muted-foreground">
              No matching assignable users found.
            </p>
          ) : availableUsers.length === issue.assignees.length && availableUsers.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Everyone who can be assigned is already on this issue.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Start typing to add someone from this repository.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
