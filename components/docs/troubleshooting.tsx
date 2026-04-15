import { Wrench } from 'lucide-react'

const Troubleshooting = () => {
  return (
    <section id="troubleshooting" className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
          <Wrench className="size-5" />
        </div>
        <h2 className="text-3xl font-bold">Troubleshooting</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-neutral-800 dark:bg-neutral-900/30">
          <h4 className="font-bold">Prisma Client missing?</h4>
          <p className="mb-2 text-sm text-zinc-500">
            Error: Cannot find module &apos;@prisma/client&apos;
          </p>
          <code className="block rounded bg-zinc-200 p-2 text-xs dark:bg-neutral-800">
            npx prisma generate
          </code>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-neutral-800 dark:bg-neutral-900/30">
          <h4 className="font-bold">Build errors?</h4>
          <p className="mb-2 text-sm text-zinc-500">
            Type errors or strange artifacts
          </p>
          <code className="block rounded bg-zinc-200 p-2 text-xs dark:bg-neutral-800">
            rm -rf .next && npm install
          </code>
        </div>
      </div>
    </section>
  )
}

export default Troubleshooting
