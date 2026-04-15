import { Palette } from 'lucide-react'

const Styling = () => {
  return (
    <section id="styling" className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
          <Palette className="size-5" />
        </div>
        <h2 className="text-3xl font-bold">Styling</h2>
      </div>
      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
          <h3 className="mb-2 font-bold">Tailwind CSS 4</h3>
          <p className="mb-4 text-sm text-zinc-600 dark:text-neutral-400">
            Utility-first CSS framework with design tokens.
          </p>
          <div className="rounded-xl bg-zinc-900 p-4 font-mono text-sm text-zinc-300 dark:bg-neutral-950">
            <div className="text-zinc-500">{`// lib/utils.ts`}</div>
            {`import { cn } from '@/lib/utils';
// Merge classes safely
className={cn('px-4 py-2 bg-primary', className)}`}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
          <h3 className="mb-2 font-bold">Dark Mode</h3>
          <p className="text-sm text-zinc-600 dark:text-neutral-400">
            Built-in support with <code className="font-mono">next-themes</code>{' '}
            and CSS variables in <code className="font-mono">globals.css</code>.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Styling
