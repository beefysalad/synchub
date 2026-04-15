import { Code2 } from 'lucide-react'

const Components = () => {
  return (
    <section id="components" className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
          <Code2 className="size-5" />
        </div>
        <h2 className="text-3xl font-bold">Components</h2>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
        <p className="mb-4 text-zinc-600 dark:text-neutral-400">
          Built with <strong>shadcn/ui</strong>. Components are located in{' '}
          <code className="font-mono">components/ui/</code>.
        </p>
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h4 className="mb-1 font-bold">Button</h4>
            <code className="text-xs text-zinc-500">
              components/ui/button.tsx
            </code>
          </div>
          <div className="rounded-lg border p-4">
            <h4 className="mb-1 font-bold">Input</h4>
            <code className="text-xs text-zinc-500">
              components/ui/input.tsx
            </code>
          </div>
        </div>
        <div className="inline-block rounded-lg bg-zinc-900 px-4 py-2 font-mono text-sm text-white dark:bg-neutral-950">
          npx shadcn@latest add button dialog
        </div>
      </div>
    </section>
  )
}

export default Components
