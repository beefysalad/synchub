import { Boxes } from 'lucide-react'

const Architecture = () => {
  return (
    <section id="architecture" className="space-y-12">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
          <Boxes className="size-5" />
        </div>
        <h2 className="text-3xl font-bold">Architecture</h2>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/50 dark:border-neutral-800 dark:bg-neutral-900/30">
        <div className="grid gap-8 p-8 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Core Structure</h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-neutral-400">
              <li className="flex gap-2">
                <span className="font-mono font-bold text-zinc-900 dark:text-neutral-100">
                  app/
                </span>{' '}
                Next.js App Router structure
              </li>
              <li className="flex gap-2">
                <span className="font-mono font-bold text-zinc-900 dark:text-neutral-100">
                  lib/
                </span>{' '}
                Utilities & Logic
              </li>
              <li className="flex gap-2">
                <span className="font-mono font-bold text-zinc-900 dark:text-neutral-100">
                  lib/routes.ts
                </span>{' '}
                Route definitions
              </li>
              <li className="flex gap-2">
                <span className="font-mono font-bold text-zinc-900 dark:text-neutral-100">
                  proxy.ts
                </span>{' '}
                Edge-compatible route protection
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Edge Compatibility</h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-neutral-400">
              <li>
                <strong>Auth Split:</strong> Auth logic is separated into{' '}
                <code className="font-mono font-bold text-zinc-900 dark:text-neutral-100">
                  services/
                </code>{' '}
                (Node.js runtime) and{' '}
                <code className="font-mono font-bold text-zinc-900 dark:text-neutral-100">
                  routes.ts
                </code>{' '}
                (Edge runtime).
              </li>
              <li>
                <strong>Middleware:</strong> Uses{' '}
                <code className="font-mono font-bold text-zinc-900 dark:text-neutral-100">
                  proxy.ts
                </code>{' '}
                to validate sessions on the Edge without needing the full
                database adapter.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Architecture
