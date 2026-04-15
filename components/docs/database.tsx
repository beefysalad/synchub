import { Database } from 'lucide-react'
import React from 'react'

const DatabaseComponent = () => {
  return (
    <section id="database" className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
          <Database className="size-5" />
        </div>
        <h2 className="text-3xl font-bold">Database & Prisma</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
          <h3 className="mb-4 text-xl font-bold">Workflow</h3>
          <ul className="space-y-3 text-sm text-zinc-600 dark:text-neutral-400">
            <li>
              1. Modify <code className="font-mono">prisma/schema.prisma</code>
            </li>
            <li>
              2. Run <code className="font-mono">npx prisma migrate dev</code>
            </li>
            <li>
              3. Use generated client:{' '}
              <code className="font-mono">prisma.user.findMany()</code>
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
          <h3 className="mb-4 text-xl font-bold">Useful Commands</h3>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between rounded bg-zinc-200 p-2 dark:bg-neutral-800">
              <span>npx prisma studio</span>
              <span className="text-zinc-500"># GUI</span>
            </div>
            <div className="flex justify-between rounded bg-zinc-200 p-2 dark:bg-neutral-800">
              <span>npx prisma generate</span>
              <span className="text-zinc-500"># Regen Client</span>
            </div>
            <div className="flex justify-between rounded bg-zinc-200 p-2 dark:bg-neutral-800">
              <span>npm run db:seed</span>
              <span className="text-zinc-500"># Seed Data</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
        <h3 className="mb-4 text-xl font-bold">Data Access Patterns</h3>
        <p className="mb-4 text-zinc-600 dark:text-neutral-400">
          Create specific data access functions in{' '}
          <code className="font-mono">lib/data/</code> instead of writing raw
          queries in components.
        </p>
        <div className="overflow-hidden rounded-xl bg-zinc-900 p-4 dark:bg-neutral-950">
          <pre className="overflow-x-auto text-sm text-zinc-300">
            <code>{`// lib/data/user.ts
import { prisma } from '@/lib/prisma';

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: { posts: true },
  });
}`}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}

export default DatabaseComponent
