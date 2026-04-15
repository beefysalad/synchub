'use client'

import { useState } from 'react'
import { X, Info, GitMerge, Bot, FileText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const UPDATES = [
  {
    title: 'Automated Branch Cleanup',
    description:
      'GitHub Actions now automatically delete your branches after they are merged, keeping your repository clean.',
    icon: GitMerge,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    title: 'PR Agent Integration',
    description:
      'AI-powered pull request reviews and suggestions directly in your workflow.',
    icon: Bot,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Technical Documentation',
    description:
      'Comprehensive guides available at /docs for coding standards and setup.',
    icon: FileText,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
]

export const WhatsNewModal = () => {
  const [isOpen, setIsOpen] = useState(true)

  const handleClose = () => {
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="animate-in fade-in absolute inset-0 bg-zinc-950/40 backdrop-blur-sm duration-300"
        onClick={handleClose}
      />

      <div className="animate-in zoom-in-95 fade-in relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl duration-300 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-neutral-50 dark:text-neutral-900">
                <Info className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  What&apos;s New
                </h2>
                <p className="mt-0.5 text-xs font-medium tracking-widest text-zinc-500 uppercase">
                  Template Updates{' '}
                  <span className="text-zinc-900 lowercase dark:text-neutral-100">
                    v1.0.5
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-neutral-800"
            >
              <X className="size-5 text-zinc-400" />
            </button>
          </div>

          <div className="space-y-6">
            {UPDATES.map((update, idx) => (
              <div key={idx} className="flex gap-4">
                <div
                  className={`flex size-10 flex-shrink-0 items-center justify-center rounded-xl ${update.bg}`}
                >
                  <update.icon className={`size-5 ${update.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-neutral-100">
                    {update.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">
                    {update.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Button
              onClick={handleClose}
              className="h-12 w-full rounded-full bg-zinc-900 font-bold text-white shadow-lg shadow-zinc-900/10 transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-neutral-50 dark:text-neutral-950 dark:shadow-none dark:hover:bg-neutral-200"
            >
              Got it, let&apos;s go!
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
