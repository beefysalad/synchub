'use client'

import { Lightbulb } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useGithubDailySummaryQuery } from '@/hooks/use-github-daily-summary'

export function DailySummaryCard() {
  const dailySummaryQuery = useGithubDailySummaryQuery()
  const renderedSummary = dailySummaryQuery.data

  return (
    <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
      <CardHeader>
        <div>
          <CardTitle>Daily summary</CardTitle>
          <CardDescription>
            Review today&apos;s saved AI recap across your tracked repositories. Manual controls live in Settings, while automatic generation can be handled by your cron job.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {renderedSummary ? (
          <div className="space-y-5">
            <div>
              <p className="text-xl font-semibold">
                {renderedSummary.headline}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {renderedSummary.overview}
              </p>
            </div>

            {renderedSummary.insights && renderedSummary.insights.length > 0 && (
              <div className="rounded-3xl border border-indigo-200/50 bg-indigo-50/20 px-5 py-5 dark:border-indigo-900/30 dark:bg-indigo-950/20">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-sm">
                    <Lightbulb className="size-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 uppercase tracking-widest">
                    Smart Insights
                  </h4>
                </div>
                <ul className="space-y-2">
                  {renderedSummary.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-400" />
                      <p className="text-sm text-indigo-900/80 dark:text-indigo-200/80">
                        {insight}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {renderedSummary.repositories.length ? (
              <div className="space-y-4">
                {renderedSummary.repositories.map((repository) => (
                  <div
                    key={repository.repository}
                    className="rounded-3xl border border-slate-200/70 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <p className="font-semibold text-foreground">
                      {repository.repository}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {repository.highlights.map((highlight) => (
                        <li key={highlight}>• {highlight}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm text-muted-foreground dark:border-slate-700">
                No repository activity was summarized for today.
              </div>
            )}
          </div>
        ) : dailySummaryQuery.isFetching ? (
          <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
            <Spinner className="mb-4 size-8" />
            <p>Fetching today&apos;s saved summary...</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm text-muted-foreground dark:border-slate-700">
            No daily summary has been generated for today yet. You can create or send one from the Settings page, or let your cron job generate it automatically.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
