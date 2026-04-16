'use client'

import { MessageCircle, Save, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import {
  useDiscordChannels,
  useGithubDailySummary,
  useGithubDailySummaryQuery,
  useSendGithubDailySummary,
  useUpdateDailySummarySettings,
} from '@/hooks/use-github-daily-summary'

export function DailySummarySettingsForm({
  initialChannelId,
}: {
  initialChannelId?: string
}) {
  const [selectedChannel, setSelectedChannel] = useState(initialChannelId ?? '')
  const { data: channels, isLoading: isLoadingChannels } = useDiscordChannels()
  const dailySummaryQuery = useGithubDailySummaryQuery()
  const generateDailySummary = useGithubDailySummary()
  const sendDailySummary = useSendGithubDailySummary()
  const updateSettings = useUpdateDailySummarySettings()
  const currentSummary =
    generateDailySummary.data ??
    sendDailySummary.data?.summary ??
    dailySummaryQuery.data

  async function handleSave() {
    try {
      await updateSettings.mutateAsync({
        discordChannelId: selectedChannel,
      })
      toast.success('Daily summary preferences saved')
    } catch (error) {
      toast.error('Failed to save preferences')
    }
  }

  async function handleGenerate() {
    try {
      await generateDailySummary.mutateAsync({ force: true })
      await dailySummaryQuery.refetch()
      toast.success("Today's daily summary has been regenerated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate summary'
      )
    }
  }

  async function handleSend(providers: Array<'TELEGRAM' | 'DISCORD'>) {
    try {
      const response = await sendDailySummary.mutateAsync({ providers })
      const label =
        response.deliveredProviders.length > 1
          ? 'Telegram and Discord'
          : response.deliveredProviders[0] === 'TELEGRAM'
            ? 'Telegram'
            : 'Discord'

      toast.success(`Daily summary sent to ${label}`)
      await dailySummaryQuery.refetch()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send summary'
      )
    }
  }

  const isSaving = updateSettings.isPending
  const isTesting =
    dailySummaryQuery.isFetching ||
    generateDailySummary.isPending ||
    sendDailySummary.isPending

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">
          Discord Target Channel
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            disabled={isSaving || isLoadingChannels}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-indigo-500/40 dark:focus:ring-indigo-500/20"
          >
            <option value="">Use linked default channel</option>
            {channels?.map((channel) => (
              <option key={channel.id} value={channel.id}>
                #{channel.name}
              </option>
            ))}
          </select>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoadingChannels}
            className="rounded-full"
          >
            {isSaving ? (
              <Spinner className="mr-2 inline size-4" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save Preference
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Choose which Discord channel should receive your automated daily
          recaps.
        </p>
      </div>

      <Card className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Manual Testing
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Use these controls to test generation and delivery manually. For
              production, point cron-job.org at your daily summary cron endpoint
              so summaries are created automatically each day.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isTesting}
              className="rounded-full"
            >
              {generateDailySummary.isPending ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Generate today&apos;s summary
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSend(['TELEGRAM'])}
              disabled={isTesting || !currentSummary}
              className="rounded-full"
            >
              {sendDailySummary.isPending ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  Send to Telegram
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSend(['DISCORD'])}
              disabled={isTesting || !currentSummary}
              className="rounded-full"
            >
              {sendDailySummary.isPending ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 size-4" />
                  Send to Discord
                </>
              )}
            </Button>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-muted-foreground dark:border-slate-700">
            {dailySummaryQuery.isFetching ? (
              'Checking whether a summary already exists for today...'
            ) : currentSummary ? (
              <>
                <span className="font-medium text-foreground">
                  Today&apos;s summary is ready.
                </span>{' '}
                {currentSummary.headline}
              </>
            ) : (
              'No daily summary exists for today yet. Generate one first, then send it to Telegram or Discord.'
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
