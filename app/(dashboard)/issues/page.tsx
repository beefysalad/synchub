import { CheckCircle2, Clock3, GitPullRequestArrow, Tags } from 'lucide-react'

import { SectionHeader } from '@/components/dashboard/section-header'
import { StatusCard } from '@/components/dashboard/status-card'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const commands = [
  'Create issues from Telegram and Discord',
  'List repository issues and assigned issues',
  'Assign users and apply labels',
  'Comment, close, and reopen issues',
]

export default function IssuesPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="GitHub Issue Management"
        title="One service layer, multiple chat surfaces"
        description="The issue workflow is centralized in `lib/github` so Telegram, Discord, and the web dashboard can all call the same operations."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={CheckCircle2}
          label="Create"
          value="Scaffolded"
          detail="POST `/api/github/issues` is wired to the GitHub service layer."
        />
        <StatusCard
          icon={Clock3}
          label="List"
          value="Scaffolded"
          detail="GET `/api/github/issues` accepts repository context via query params."
        />
        <StatusCard
          icon={Tags}
          label="Labels"
          value="Planned"
          detail="Service structure leaves room for labels and assignees in the next phase."
        />
        <StatusCard
          icon={GitPullRequestArrow}
          label="Sync"
          value="Future"
          detail="GitHub webhook fan-in is documented for the later real-time phase."
        />
      </div>

      <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
        <CardHeader>
          <CardTitle>Core Commands</CardTitle>
          <CardDescription>
            These are the core issue-management capabilities the current design
            is built around.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {commands.map((command) => (
            <div
              key={command}
              className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
            >
              {command}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
