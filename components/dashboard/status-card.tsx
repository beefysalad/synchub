import { LucideIcon } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type StatusCardProps = {
  icon: LucideIcon
  label: string
  value: string
  detail: string
}

export function StatusCard({
  icon: Icon,
  label,
  value,
  detail,
}: StatusCardProps) {
  return (
    <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
          <CardDescription className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground/70" title={label}>{label}</CardDescription>
          <CardTitle className="text-lg font-semibold tracking-tight truncate" title={value}>{value}</CardTitle>
        </div>
        <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}
