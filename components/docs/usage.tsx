import { LifeBuoy, Trash2 } from 'lucide-react'

const Usage = () => {
  return (
    <section id="usage" className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
          <LifeBuoy className="size-5" />
        </div>
        <h2 className="text-3xl font-bold">Using this Template</h2>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-900/30">
        <p className="mb-6 text-zinc-600 dark:text-neutral-400">
          Follow these steps to clean up the template and make it your own:
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-bold">
                <Trash2 className="size-4 text-red-500" />
                Delete Assets
              </h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-neutral-400">
                <li>
                  <code className="rounded bg-zinc-200 px-1 dark:bg-neutral-800">
                    public/file.svg
                  </code>
                </li>
                <li>
                  <code className="rounded bg-zinc-200 px-1 dark:bg-neutral-800">
                    public/globe.svg
                  </code>
                </li>
                <li>
                  <code className="rounded bg-zinc-200 px-1 dark:bg-neutral-800">
                    public/window.svg
                  </code>
                </li>
                <li>
                  <code className="rounded bg-zinc-200 px-1 dark:bg-neutral-800">
                    public/ptrck.jpg
                  </code>{' '}
                  (Replace with your own)
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-bold">Clean Components</h4>
              <p className="text-sm text-zinc-600 dark:text-neutral-400">
                Remove{' '}
                <code className="rounded bg-zinc-200 px-1 dark:bg-neutral-800">
                  components/dashboard/whats-new-modal.tsx
                </code>{' '}
                <code className="rounded bg-zinc-200 px-1 dark:bg-neutral-800">
                  components/dashboard/index.tsx
                </code>{' '}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-bold">Update Metadata</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-neutral-400">
                <li>
                  Modify{' '}
                  <code className="rounded bg-zinc-200 px-1 dark:bg-neutral-800">
                    app/layout.tsx
                  </code>{' '}
                  metadata.
                </li>
                <li>
                  Update{' '}
                  <code className="rounded bg-zinc-200 px-1 dark:bg-neutral-800">
                    public/site.webmanifest
                  </code>
                  .
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-bold">Update Content</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-neutral-400">
                <li>
                  Customize{' '}
                  <code className="rounded bg-zinc-200 px-1 dark:bg-neutral-800">
                    app/page.tsx
                  </code>{' '}
                  (Landing Page).
                </li>
                <li>
                  Update or delete everything under
                  <code className="rounded bg-zinc-200 px-1 dark:bg-neutral-800">
                    app/docs/
                  </code>{' '}
                  (Documentation).
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Usage
