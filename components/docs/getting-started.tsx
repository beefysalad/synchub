import { Terminal } from 'lucide-react'

const GettingStarted = () => {
  return (
    <section id="getting-started" className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
          <Terminal className="size-5" />
        </div>
        <h2 className="text-3xl font-bold">Getting Started</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
          <h3 className="mb-4 text-xl font-bold">1. Project Setup</h3>
          <div className="space-y-4">
            <p className="text-zinc-600 dark:text-neutral-400">
              Clone the repo and verify prerequisites: Node 18+ and PostgreSQL.
            </p>
            <pre className="overflow-x-auto rounded-xl bg-zinc-900 p-5 font-mono text-sm text-zinc-300 dark:bg-neutral-950">
              <code className="block break-all whitespace-pre-wrap">{`git clone https://github.com/beefysalad/nexion.git
cd nexion
npm install`}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
          <h3 className="mb-4 text-xl font-bold">2. Environment & DB</h3>
          <div className="space-y-4">
            <p className="text-zinc-600 dark:text-neutral-400">
              Copy{' '}
              <code className="rounded bg-zinc-200 px-1.5 py-0.5 dark:bg-neutral-800">
                .env.example
              </code>{' '}
              to{' '}
              <code className="rounded bg-zinc-200 px-1.5 py-0.5 dark:bg-neutral-800">
                .env
              </code>{' '}
              and run migrations.
            </p>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <pre className="overflow-x-auto text-sm">
                <code>{`npx prisma migrate dev
npm run dev`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
        <h3 className="mb-4 text-xl font-bold">Environment Variables</h3>
        <p className="mb-4 text-zinc-600 dark:text-neutral-400">
          Ensure your{' '}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 dark:bg-neutral-800">
            .env
          </code>{' '}
          file has the following:
        </p>
        <div className="rounded-xl bg-zinc-900 p-5 font-mono text-sm text-zinc-300 dark:bg-neutral-950">
          <div className="space-y-1">
            <div>DATABASE_URL=&quot;postgresql://...&quot;</div>
            <div>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=&quot;pk_test_...&quot;</div>
            <div>CLERK_SECRET_KEY=&quot;sk_test_...&quot;</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
        <h3 className="mb-4 text-xl font-bold">Docker Quickstart</h3>
        <p className="mb-4 text-zinc-600 dark:text-neutral-400">
          Prefer running everything in containers? The project now ships with a
          Dockerfile, Compose stack, and a Postgres service out of the box.
        </p>
        <pre className="overflow-x-auto rounded-xl bg-zinc-900 p-5 font-mono text-sm text-zinc-300 dark:bg-neutral-950">
          <code className="block break-all whitespace-pre-wrap">{`cp .env.example .env
docker compose up --build`}</code>
        </pre>
        <p className="mt-4 text-sm text-zinc-600 dark:text-neutral-400">
          On startup, the container applies Prisma migrations, seeds the
          database, and serves the app on{' '}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 dark:bg-neutral-800">
            localhost:3000
          </code>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
        <h3 className="mb-4 text-xl font-bold">Creating a Clean Boilerplate</h3>
        <p className="mb-4 text-zinc-600 dark:text-neutral-400">
          If you want to remove the sample UI pages (like this docs page, the
          landing page, and the example dashboard) to start entirely fresh, you
          can run the cleanup command:
        </p>
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <pre className="overflow-x-auto text-sm">
            <code>npm run clean</code>
          </pre>
        </div>

        <p className="mb-4 text-zinc-600 dark:text-neutral-400">
          If you change your mind and want the sample pages back, you can
          restore them easily.
        </p>
        <div className="mb-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <pre className="overflow-x-auto text-sm">
            <code>npm run restore</code>
          </pre>
        </div>
      </div>
    </section>
  )
}

export default GettingStarted
