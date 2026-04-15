import { GitMerge } from 'lucide-react'

const Workflows = () => {
  return (
    <section id="workflows" className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
          <GitMerge className="size-5" />
        </div>
        <h2 className="text-3xl font-bold">Workflows</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-neutral-800 dark:bg-neutral-900/30">
          <h3 className="mb-2 font-bold">Branch Cleanup</h3>
          <p className="text-sm text-zinc-600 dark:text-neutral-400">
            A GitHub Action automatically deletes feature branches after they
            are merged into <code className="font-mono">main</code>, keeping
            your repository clean.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-neutral-800 dark:bg-neutral-900/30">
          <h3 className="mb-2 font-bold">PR Agent</h3>
          <p className="text-sm text-zinc-600 dark:text-neutral-400">
            AI-powered code review and PR descriptions are generated
            automatically for every pull request to assist with maintenance.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-neutral-800 dark:bg-neutral-900/30">
          <h3 className="mb-2 font-bold">Database Seeding</h3>
          <p className="mb-4 text-sm text-zinc-600 dark:text-neutral-400">
            Populate your database with initial data for development.
          </p>
          <code className="block rounded bg-zinc-200 p-2 text-xs dark:bg-neutral-800">
            npm run db:seed
          </code>
        </div>
      </div>
    </section>
  )
}

export default Workflows
