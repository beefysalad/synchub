import { ReactNode } from 'react'

type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-2">
        {eyebrow ? (
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="text-base text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}
