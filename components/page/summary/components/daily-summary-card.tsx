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

function formatCount(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`
}

function formatRepositoryStatsSentence(stats: {
  commits: number
  pullRequests: number
  issues: number
}) {
  return `Today you committed ${formatCount(
    stats.commits,
    'time',
    'times'
  )}, opened ${formatCount(
    stats.pullRequests,
    'pull request',
    'pull requests'
  )}, and created ${formatCount(stats.issues, 'issue', 'issues')}.`
}

function SummaryList({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
  if (!items.length) {
    return null
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-2 text-sm text-foreground/80">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  )
}

export function DailySummaryCard() {
  const dailySummaryQuery = useGithubDailySummaryQuery()
  const renderedSummary = dailySummaryQuery.data

  return (
    <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
      <CardHeader>
        <div>
          <CardTitle>Daily summary</CardTitle>
          <CardDescription>
            Review today&apos;s saved AI recap across your tracked repositories.
            Manual controls live in Settings, while automatic generation can be
            handled by your cron job.
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
              <p className="text-muted-foreground mt-2 text-sm">
                {renderedSummary.overview}
              </p>
            </div>

            {renderedSummary.insights &&
              renderedSummary.insights.length > 0 && (
                <div className="border-primary/15 bg-primary/5 rounded-3xl border px-5 py-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg shadow-sm">
                      <Lightbulb className="size-4" />
                    </div>
                    <h4 className="text-primary text-sm font-semibold tracking-widest uppercase">
                      AI Insights
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {renderedSummary.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="bg-primary/60 mt-1.5 size-1.5 shrink-0 rounded-full" />
                        <p className="text-primary/85 dark:text-primary/85 text-sm">
                          {insight}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {renderedSummary.repositories.length ? (
              <div className="space-y-4">
                {renderedSummary.repositories.map((repository) => {
                  const stats = repository.stats ?? {
                    commits: 0,
                    pullRequests: 0,
                    issues: 0,
                  }

                  return (
                    <div
                      key={repository.repository}
                      className="glass-surface rounded-3xl px-5 py-5 transition-all duration-300"
                    >
                      <p className="text-foreground font-semibold">
                        {repository.repository}
                      </p>
                      <p className="mt-3 text-sm font-medium text-foreground/75">
                        {formatRepositoryStatsSentence(stats)}
                      </p>
                      <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                        {repository.highlights.map((highlight) => (
                          <li key={highlight}>• {highlight}</li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-muted-foreground rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm dark:border-slate-700">
                No repository activity was summarized for today.
              </div>
            )}

            {(renderedSummary.delivered.length > 0 ||
              renderedSummary.inProgress.length > 0 ||
              renderedSummary.followUps.length > 0) && (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="glass-surface rounded-3xl px-5 py-5 transition-all duration-300">
                  <SummaryList
                    title="Delivered"
                    items={renderedSummary.delivered}
                  />
                </div>
                <div className="glass-surface rounded-3xl px-5 py-5 transition-all duration-300">
                  <SummaryList
                    title="In Progress"
                    items={renderedSummary.inProgress}
                  />
                </div>
                <div className="glass-surface rounded-3xl px-5 py-5 transition-all duration-300">
                  <SummaryList
                    title="Follow-ups"
                    items={renderedSummary.followUps}
                  />
                </div>
              </div>
            )}
          </div>
        ) : dailySummaryQuery.isFetching ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-sm">
            <Spinner className="mb-4 size-8" />
            <p>Fetching today&apos;s saved summary...</p>
          </div>
        ) : (
          <div className="text-muted-foreground rounded-3xl border border-dashed border-slate-300 px-5 py-8 text-sm dark:border-slate-700">
            No daily summary has been generated for today yet. You can create or
            send one from the Settings page, or let your cron job generate it
            automatically.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
