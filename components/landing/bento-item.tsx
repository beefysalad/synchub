import React from 'react'

const BentoItem = ({
  icon,
  title,
  description,
  className,
}: {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}) => {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:border-zinc-300 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700 ${className}`}
    >
      <div className="relative z-10 space-y-4">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-zinc-50 shadow-sm transition-transform group-hover:scale-110 dark:bg-neutral-800">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">
            {description}
          </p>
        </div>
      </div>
      <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-zinc-100/50 to-transparent p-24 opacity-0 transition-opacity group-hover:opacity-100 dark:from-neutral-800/50" />
    </div>
  )
}

export default BentoItem
