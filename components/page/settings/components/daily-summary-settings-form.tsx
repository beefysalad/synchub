'use client'

import { MessageCircle, Save, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { GeminiModelOption } from '@/lib/github/types'
import {
  useDiscordChannels,
  useGithubDailySummary,
  useGithubDailySummaryQuery,
  useSendGithubDailySummary,
  useUpdateDailySummarySettings,
} from '@/hooks/use-github-daily-summary'

export function DailySummarySettingsForm({
  initialChannelId,
  initialReminderChannelId,
  initialAiModel,
}: {
  initialChannelId?: string
  initialReminderChannelId?: string
  initialAiModel: GeminiModelOption
}) {
  const [selectedChannel, setSelectedChannel] = useState(initialChannelId ?? '')
  const [selectedReminderChannel, setSelectedReminderChannel] = useState(
    initialReminderChannelId ?? ''
  )
  const [selectedAiModel, setSelectedAiModel] =
    useState<GeminiModelOption>(initialAiModel)
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
        reminderChannelId: selectedReminderChannel,
        aiModel: selectedAiModel,
      })
      toast.success('AI and delivery preferences saved')
    } catch {
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
    <div className="space-y-5">
      <div className="glass-surface rounded-3xl p-5 transition-all duration-300">
        <div className="space-y-4">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">
              AI model
            </p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Choose which Gemini model SyncHub should use for summaries and the
              other AI helpers.
            </p>
          </div>

          <select
            value={selectedAiModel}
            onChange={(e) =>
              setSelectedAiModel(e.target.value as GeminiModelOption)
            }
            disabled={isSaving}
            className="border-border bg-background focus:border-primary/50 focus:ring-primary/20 w-full rounded-2xl border px-4 py-3 text-sm transition-all outline-none focus:ring-2"
          >
            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          </select>

          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">
              Daily summary routing
            </p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Choose which Discord channel should receive your automated daily
              recaps.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              disabled={isSaving || isLoadingChannels}
              className="border-border bg-background focus:border-primary/50 focus:ring-primary/20 w-full rounded-2xl border px-4 py-3 text-sm transition-all outline-none focus:ring-2"
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
              disabled={isSaving}
              className="h-11 rounded-full px-5"
            >
              {isSaving ? (
                <Spinner className="mr-2 inline size-4" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Save preference
            </Button>
          </div>

          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">
              Reminder routing
            </p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Choose which Discord channel should receive reminder deliveries so
              they don&apos;t get mixed into your recap channel.
            </p>
          </div>

          <select
            value={selectedReminderChannel}
            onChange={(e) => setSelectedReminderChannel(e.target.value)}
            disabled={isSaving || isLoadingChannels}
            className="border-border bg-background focus:border-primary/50 focus:ring-primary/20 w-full rounded-2xl border px-4 py-3 text-sm transition-all outline-none focus:ring-2"
          >
            <option value="">Use linked default channel</option>
            {channels?.map((channel) => (
              <option key={channel.id} value={channel.id}>
                #{channel.name}
              </option>
            ))}
          </select>

          {!channels?.length && !isLoadingChannels ? (
            <p className="text-muted-foreground text-xs">
              No Discord channels are available right now. You can still save
              your AI model preference and add channel routing later.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className="glass-surface rounded-3xl p-5 transition-all duration-300">
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">
                Manual testing
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Test generation and delivery manually. For production, point
                cron-job.org at your daily summary cron endpoint so summaries
                are created automatically each day.
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
                  <>Generate today&apos;s summary</>
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
          </div>
        </div>
      </div>
    </div>
  )
}
