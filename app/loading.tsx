import { Spinner } from '@/components/ui/spinner'

export default function GlobalLoading() {
  return (
    <div className="bg-background/72 fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl">
      <div className="glass-panel flex min-w-[220px] flex-col items-center gap-4 px-8 py-7 text-center shadow-xl dark:shadow-none">
        <Spinner className="text-primary size-8" />
        <div className="space-y-1">
          <p className="text-foreground text-base font-semibold tracking-tight">
            Redirecting
          </p>
          <p className="text-muted-foreground text-sm">
            Loading your next workspace view...
          </p>
        </div>
      </div>
    </div>
  )
}
