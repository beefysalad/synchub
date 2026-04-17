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
    <Card className="gap-4 transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="min-w-0 flex-1 space-y-1.5 pr-4">
          <CardDescription
            className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/60 transition-all duration-300"
            title={label}
          >
            {label}
          </CardDescription>
          <CardTitle className="truncate text-xl font-bold tracking-tight text-foreground transition-all duration-300" title={value}>
            {value}
          </CardTitle>
        </div>
        <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all duration-300">
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground/80 transition-all duration-300">{detail}</p>
      </CardContent>
    </Card>

  )
}
