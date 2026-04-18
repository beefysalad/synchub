import { AccountProvider } from '@/app/generated/prisma/client'

import { githubAssistantService } from '@/lib/ai/github-assistant'
import { getCurrentClerkUserProfile } from '@/lib/clerk'
import { sendDiscordMessage } from '@/lib/discord/api'
import { githubCommitsService } from '@/lib/github/commits'
import type {
  GithubDailySummaryResponse,
  GithubDailySummaryRawResponse,
} from '@/lib/github/types'
import { githubIssueService } from '@/lib/github/issues'
import { githubPullsService } from '@/lib/github/pulls'
import prisma from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram/api'

const DEFAULT_DAILY_SUMMARY_TIMEZONE = 'Asia/Singapore'

function getDailySummaryTimezone() {
  return process.env.DAILY_SUMMARY_TIMEZONE || DEFAULT_DAILY_SUMMARY_TIMEZONE
}

function getDatePartsInTimezone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'

  return { year, month, day }
}

function getDateKeyInTimezone(date: Date, timeZone: string) {
  const { year, month, day } = getDatePartsInTimezone(date, timeZone)
  return `${year}-${month}-${day}`
}

function getDisplayDateLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    dateStyle: 'long',
  }).format(date)
}

function isOnDateKey(
  value: Date | string | null | undefined,
  dateKey: string,
  timeZone: string
) {
  if (!value) {
    return false
  }

  return getDateKeyInTimezone(new Date(value), timeZone) === dateKey
}

function getHourInTimezone(date: Date, timeZone: string) {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      hour12: false,
    }).format(date)
  )
}

function getGreeting(date = new Date(), timeZone = getDailySummaryTimezone()) {
  const hour = getHourInTimezone(date, timeZone)

  if (hour < 12) {
    return 'Good morning'
  }

  if (hour < 18) {
    return 'Good afternoon'
  }

  return 'Good evening'
}

function getRepositoryLabel(repository: string) {
  const trimmed = repository.trim()
  const parts = trimmed.split('/')

  return parts[parts.length - 1] || trimmed
}

function normalizeInsightVoice(insight: string) {
  return insight.replace(/^The developer\b/i, 'You')
}

function escapeTelegramHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function truncateForChat(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, ' ')

  if (normalized.length <= maxLength) {
    return normalized.replace(/\.{3,}$/g, '').trim()
  }

  const slice = normalized.slice(0, maxLength)
  const punctuationBoundary = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? ')
  )

  if (punctuationBoundary >= Math.floor(maxLength * 0.55)) {
    return slice.slice(0, punctuationBoundary + 1).trim()
  }

  const wordBoundary = slice.lastIndexOf(' ')
  const clipped =
    wordBoundary >= Math.floor(maxLength * 0.55)
      ? slice.slice(0, wordBoundary)
      : slice

  return clipped.replace(/[,:;\-–—\s.]+$/g, '').trim()
}

function trimTrailingEllipses(value: string) {
  return value.replace(/\.{3,}$/g, '').trim()
}

function truncateDiscordMessage(
  sections: string[],
  maxLength = 1900
) {
  const cleanedSections = sections
    .map((section) => section.trim())
    .filter(Boolean)

  const assembled: string[] = []
  let length = 0

  for (const section of cleanedSections) {
    const nextSection =
      length === 0
        ? section
        : `\n\n${section}`

    if (length + nextSection.length <= maxLength) {
      assembled.push(section)
      length += nextSection.length
      continue
    }

    const remaining = maxLength - length - (length === 0 ? 0 : 2)

    if (remaining < 40) {
      break
    }

    const lines = section.split('\n')
    const acceptedLines: string[] = []
    let sectionLength = 0

    for (const line of lines) {
      const nextLine = acceptedLines.length === 0 ? line : `\n${line}`

      if (sectionLength + nextLine.length > remaining) {
        break
      }

      acceptedLines.push(line)
      sectionLength += nextLine.length
    }

    if (acceptedLines.length > 0) {
      assembled.push(acceptedLines.join('\n'))
    }

    break
  }

  return trimTrailingEllipses(assembled.join('\n\n'))
}

function normalizeDailySummary(
  value: GithubDailySummaryRawResponse | null | undefined,
  dateLabel: string
): GithubDailySummaryResponse {
  return {
    headline:
      truncateForChat(
        value?.headline?.trim() || `Daily summary for ${dateLabel}`,
        140
      ) || `Daily summary for ${dateLabel}`,
    overview:
      truncateForChat(
        value?.overview?.trim() ||
          'SyncHub did not find any tracked GitHub activity for today yet.',
        240
      ) || 'SyncHub did not find any tracked GitHub activity for today yet.',
    insights: Array.isArray(value?.insights)
      ? value.insights
          .map((insight) =>
            truncateForChat(normalizeInsightVoice(insight), 220)
          )
          .filter(Boolean)
          .slice(0, 3)
      : [],
    delivered: Array.isArray(value?.delivered)
      ? value.delivered
          .map((item) => truncateForChat(item, 220))
          .filter(Boolean)
          .slice(0, 5)
      : [],
    inProgress: Array.isArray(value?.inProgress)
      ? value.inProgress
          .map((item) => truncateForChat(item, 220))
          .filter(Boolean)
          .slice(0, 4)
      : [],
    followUps: Array.isArray(value?.followUps)
      ? value.followUps
          .map((item) => truncateForChat(item, 220))
          .filter(Boolean)
          .slice(0, 4)
      : [],
    repositories: Array.isArray(value?.repositories)
      ? value.repositories
          .map((repository) => ({
            repository: getRepositoryLabel(
              repository.repository?.trim() ?? ''
            ).toUpperCase(),
            stats: {
              commits:
                typeof repository.stats?.commits === 'number'
                  ? Math.max(0, repository.stats.commits)
                  : 0,
              pullRequests:
                typeof repository.stats?.pullRequests === 'number'
                  ? Math.max(0, repository.stats.pullRequests)
                  : 0,
              issues:
                typeof repository.stats?.issues === 'number'
                  ? Math.max(0, repository.stats.issues)
                  : 0,
            },
            highlights: Array.isArray(repository.highlights)
              ? repository.highlights
                  .map((highlight) => truncateForChat(highlight, 220))
                  .filter(Boolean)
                  .slice(0, 5)
              : [],
          }))
          .filter(
            (repository) =>
              repository.repository.length > 0 && repository.highlights.length > 0
          )
      : [],
  }
}

function resolveRecipientName({
  fallbackUsername,
  firstName,
  githubUsername,
  telegramUsername,
  discordUsername,
}: {
  fallbackUsername: string | null
  firstName: string | null
  githubUsername: string | null
  telegramUsername: string | null
  discordUsername: string | null
}) {
  return (
    firstName ||
    fallbackUsername ||
    githubUsername ||
    telegramUsername ||
    discordUsername ||
    'there'
  )
}

function formatRepositoryActivityLine(
  repository: GithubDailySummaryResponse['repositories'][number]
) {
  const { commits, pullRequests, issues } = repository.stats

  if (commits === 0 && pullRequests === 0 && issues === 0) {
    return 'This repository saw follow-up progress, but no new commits, pull requests, or issues were created that day.'
  }

  return `Committed ${commits} times, opened ${pullRequests} PRs, and created ${issues} issues.`
}

function formatBulletSectionHtml(title: string, items: string[]) {
  if (!items.length) {
    return ''
  }

  return `<b>${escapeTelegramHtml(title)}</b>\n${items
    .map((item) => `• ${escapeTelegramHtml(item)}`)
    .join('\n')}`
}

function formatTelegramDailySummaryMessage({
  recipientName,
  dateLabel,
  summary,
  timeZone,
}: {
  recipientName: string
  dateLabel: string
  summary: GithubDailySummaryResponse
  timeZone: string
}) {
  const insights =
    formatBulletSectionHtml('Insights', summary.insights)
  const delivered = formatBulletSectionHtml('Delivered', summary.delivered)
  const inProgress = formatBulletSectionHtml('In progress', summary.inProgress)
  const followUps = formatBulletSectionHtml('Follow-ups', summary.followUps)

  const sections = summary.repositories.length
    ? summary.repositories
        .map((repository) => {
          const highlights = repository.highlights
            .map((highlight) => `• ${escapeTelegramHtml(highlight)}`)
            .join('\n')

          return [
            `<b>${escapeTelegramHtml(repository.repository)}</b>`,
            `<i>${escapeTelegramHtml(formatRepositoryActivityLine(repository))}</i>`,
            highlights,
          ].join('\n')
        })
        .join('\n\n')
    : '• No tracked GitHub activity was found for this day.'

  return [
    `<b>${escapeTelegramHtml(getGreeting(new Date(), timeZone))} ${escapeTelegramHtml(recipientName)}</b>`,
    `Daily report for <b>${escapeTelegramHtml(dateLabel)}</b>`,
    '',
    `<b>${escapeTelegramHtml(summary.headline)}</b>`,
    escapeTelegramHtml(summary.overview),
    '',
    ...(insights ? [insights, ''] : []),
    ...(delivered ? [delivered, ''] : []),
    ...(inProgress ? [inProgress, ''] : []),
    ...(followUps ? [followUps, ''] : []),
    `<b>Repository Activity</b>`,
    sections,
  ].join('\n')
}

function formatDiscordDailySummaryMessage({
  recipientName,
  dateLabel,
  summary,
  timeZone,
}: {
  recipientName: string
  dateLabel: string
  summary: GithubDailySummaryResponse
  timeZone: string
}) {
  return truncateDiscordMessage(
    [
      `**${getGreeting(new Date(), timeZone)} ${recipientName}**`,
      `Daily report for **${dateLabel}**`,
      summary.overview ? `_${summary.overview}_` : '',
    ],
    1900
  )
}

function buildDiscordDailySummaryEmbeds({
  dateLabel,
  summary,
}: {
  dateLabel: string
  summary: GithubDailySummaryResponse
}) {
  const embeds: Array<Record<string, unknown>> = [
    {
      title: summary.headline,
      description: summary.overview,
      color: 0x2f855a,
      footer: {
        text: `Daily report • ${dateLabel}`,
      },
      fields: summary.insights.length
        ? [{
            name: 'Insights',
            value: summary.insights.map((insight) => `• ${insight}`).join('\n'),
          }]
        : [],
    },
  ]

  const topSections = [
    {
      name: 'Delivered',
      items: summary.delivered,
    },
    {
      name: 'In progress',
      items: summary.inProgress,
    },
    {
      name: 'Follow-ups',
      items: summary.followUps,
    },
  ].filter((section) => section.items.length > 0)

  for (const section of topSections) {
    embeds.push({
      title: section.name,
      color: 0x2f855a,
      description: truncateDiscordMessage(
        section.items.map((item) => `• ${item}`),
        4000
      ),
    })
  }

  for (const repository of summary.repositories.slice(0, 8)) {
    const activityLine = formatRepositoryActivityLine(repository)
    const highlights = repository.highlights.map((highlight) => `• ${highlight}`).join('\n')

    embeds.push({
      title: repository.repository,
      color: 0x14532d,
      description: truncateDiscordMessage([activityLine, '', highlights], 4000),
    })
  }

  if (!summary.repositories.length) {
    embeds.push({
      title: 'Repository Activity',
      color: 0x14532d,
      description: 'No tracked GitHub activity was found for this day.',
    })
  }

  return embeds
}

async function getSummaryUser(clerkUserId: string) {
  return prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      trackedRepos: true,
      linkedAccounts: true,
    },
  })
}

async function getExistingSummaryForUserId({
  userId,
  dateKey,
  dateLabel,
}: {
  userId: string
  dateKey: string
  dateLabel: string
}) {
  const record = await prisma.dailySummary.findUnique({
    where: {
      userId_date: {
        userId,
        date: dateKey,
      },
    },
  })

  if (!record) {
    return null
  }

  return normalizeDailySummary(
    record.summary as GithubDailySummaryRawResponse,
    dateLabel
  )
}

async function collectDailyActivities({
  userId,
  githubUsername,
  trackedRepos,
  dateKey,
  timeZone,
}: {
  userId: string
  githubUsername: string | null
  trackedRepos: Array<{
    fullName: string
    createdAt: Date
  }>
  dateKey: string
  timeZone: string
}) {
  const repoActivities = await Promise.all(
    trackedRepos.map(async (trackedRepo) => {
      const [owner, repo] = trackedRepo.fullName.split('/')

      const [commits, pulls, issues] = await Promise.all([
        githubCommitsService
          .listRepositoryCommits({
            userId,
            owner,
            repo,
          })
          .catch(() => []),
        githubPullsService
          .listRepositoryPulls({ userId, owner, repo, state: 'all' })
          .catch(() => []),
        githubIssueService
          .listRepositoryIssues({
            userId,
            owner,
            repo,
            state: 'all',
          })
          .catch(() => []),
      ])

      const hasExistingRepositoryHistory =
        commits.length > 0 || pulls.length > 0 || issues.length > 0

      const trackingEvents = isOnDateKey(
        trackedRepo.createdAt,
        dateKey,
        timeZone
      )
        ? [
            hasExistingRepositoryHistory
              ? 'This repository was newly tracked in SyncHub today, but it already existed and had prior GitHub history.'
              : 'This repository appears to have been newly created and first tracked in SyncHub today.',
          ]
        : []

      const commitHighlights = commits
        .filter((commit) => {
          const authorLogin = commit.author?.login?.toLowerCase() ?? null

          return (
            isOnDateKey(commit.commit.author.date, dateKey, timeZone) &&
            (!githubUsername || authorLogin === githubUsername)
          )
        })
        .slice(0, 20)
        .map(
          (commit) =>
            truncateForChat(
              commit.commit.message.split('\n')[0]?.trim() ?? commit.sha,
              180
            )
        )

      const relevantPulls = pulls.filter((pull) => {
          const authorLogin = pull.user.login.toLowerCase()

          return (
            isOnDateKey(pull.created_at, dateKey, timeZone) &&
            (!githubUsername || authorLogin === githubUsername)
          )
        })

      const pullHighlights = relevantPulls
        .slice(0, 20)
        .map((pull) => ({
          title: truncateForChat(
            `Opened PR #${pull.number}: ${pull.title}`,
            180
          ),
          body: pull.body ? truncateForChat(pull.body, 420) : null,
        }))

      const relevantIssues = issues.filter((issue) => {
          const authorLogin = issue.user.login.toLowerCase()

          return (
            isOnDateKey(issue.created_at, dateKey, timeZone) &&
            (!githubUsername || authorLogin === githubUsername)
          )
        })

      const issueHighlights = relevantIssues
        .slice(0, 20)
        .map((issue) => ({
          title: truncateForChat(
            `Opened issue #${issue.number}: ${issue.title}`,
            180
          ),
          body: issue.body ? truncateForChat(issue.body, 420) : null,
        }))

      return {
        repository: getRepositoryLabel(trackedRepo.fullName).toUpperCase(),
        stats: {
          commits: commitHighlights.length,
          pullRequests: relevantPulls.length,
          issues: relevantIssues.length,
        },
        trackingEvents,
        commits: commitHighlights,
        pullRequests: pullHighlights,
        issues: issueHighlights,
      }
    })
  )

  return repoActivities.filter(
    (activity) =>
      activity.trackingEvents.length > 0 ||
      activity.commits.length > 0 ||
      activity.pullRequests.length > 0 ||
      activity.issues.length > 0
  )
}

export const dailySummaryService = {
  getDateKey(date = new Date()) {
    return getDateKeyInTimezone(date, getDailySummaryTimezone())
  },

  getDateLabel(date = new Date()) {
    return getDisplayDateLabel(date, getDailySummaryTimezone())
  },

  async getExistingForClerkUser(
    clerkUserId: string,
    { date = new Date() }: { date?: Date } = {}
  ) {
    const user = await getSummaryUser(clerkUserId)

    if (!user) {
      throw new Error('User not found')
    }

    const dateKey = this.getDateKey(date)
    const dateLabel = this.getDateLabel(date)
    const summary = await getExistingSummaryForUserId({
      userId: user.id,
      dateKey,
      dateLabel,
    })

    return {
      user,
      summary,
      dateKey,
      dateLabel,
    }
  },

  async generateForClerkUser(
    clerkUserId: string,
    {
      date = new Date(),
      force = false,
    }: {
      date?: Date
      force?: boolean
    } = {}
  ) {
    const user = await getSummaryUser(clerkUserId)

    if (!user) {
      throw new Error('User not found')
    }

    const dateKey = this.getDateKey(date)
    const dateLabel = this.getDateLabel(date)
    const timeZone = getDailySummaryTimezone()

    if (!force) {
      const existing = await getExistingSummaryForUserId({
        userId: user.id,
        dateKey,
        dateLabel,
      })

      if (existing) {
        return {
          user,
          summary: existing,
          dateKey,
          dateLabel,
          reusedExisting: true,
        }
      }
    }

    const githubAccount = user.linkedAccounts.find(
      (account) => account.provider === AccountProvider.GITHUB
    )
    const githubUsername = githubAccount?.username?.toLowerCase() ?? null
    const activities = await collectDailyActivities({
      userId: user.id,
      githubUsername,
      trackedRepos: user.trackedRepos,
      dateKey,
      timeZone,
    })

    const summary = activities.length
      ? normalizeDailySummary(
          await githubAssistantService.summarizeDailyActivity({
            userId: user.id,
            dateLabel,
            activities,
          }),
          dateLabel
        )
      : normalizeDailySummary(
          {
            headline: 'No work captured today',
            overview:
              'SyncHub did not find any tracked GitHub activity for this day yet.',
            insights: [],
            delivered: [],
            inProgress: [],
            followUps: [],
            repositories: [],
          },
          dateLabel
        )

    if (activities.length) {
      const statsByRepository = new Map(
        activities.map((activity) => [activity.repository, activity.stats])
      )

      summary.repositories = summary.repositories.map((repository) => ({
        ...repository,
        stats: statsByRepository.get(repository.repository) ?? {
          commits: 0,
          pullRequests: 0,
          issues: 0,
        },
      }))
    }

    await prisma.dailySummary.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: dateKey,
        },
      },
      create: {
        userId: user.id,
        date: dateKey,
        summary,
      },
      update: {
        summary,
      },
    })

    return {
      user,
      summary,
      dateKey,
      dateLabel,
      reusedExisting: false,
    }
  },

  async generateForAllUsers({
    date = new Date(),
    force = false,
  }: {
    date?: Date
    force?: boolean
  } = {}) {
    const users = await prisma.user.findMany({
      where: {
        trackedRepos: {
          some: {},
        },
      },
      select: {
        clerkUserId: true,
      },
    })

    let generated = 0
    let reused = 0
    let failed = 0

    for (const user of users) {
      try {
        const result = await this.generateForClerkUser(user.clerkUserId, {
          date,
          force,
        })

        if (result.reusedExisting) {
          reused += 1
        } else {
          generated += 1
        }
      } catch (error) {
        failed += 1
        console.error(
          `Daily summary generation failed for ${user.clerkUserId}:`,
          error
        )
      }
    }

    return {
      processed: users.length,
      generated,
      reused,
      failed,
      dateKey: this.getDateKey(date),
    }
  },

  async generateAndSendForAllUsers({
    date = new Date(),
    force = false,
  }: {
    date?: Date
    force?: boolean
  } = {}) {
    const users = await prisma.user.findMany({
      where: {
        trackedRepos: {
          some: {},
        },
        linkedAccounts: {
          some: {
            provider: {
              in: [AccountProvider.TELEGRAM, AccountProvider.DISCORD],
            },
            chatId: {
              not: null,
            },
          },
        },
      },
      select: {
        clerkUserId: true,
        linkedAccounts: {
          where: {
            provider: {
              in: [AccountProvider.TELEGRAM, AccountProvider.DISCORD],
            },
            chatId: {
              not: null,
            },
          },
          select: {
            provider: true,
          },
        },
      },
    })

    let generated = 0
    let reused = 0
    let delivered = 0
    let failed = 0

    for (const user of users) {
      try {
        const generationResult = await this.generateForClerkUser(user.clerkUserId, {
          date,
          force,
        })

        if (generationResult.reusedExisting) {
          reused += 1
        } else {
          generated += 1
        }

        const providers = Array.from(
          new Set(user.linkedAccounts.map((account) => account.provider))
        )

        if (!providers.length) {
          continue
        }

        await this.sendToLinkedApps({
          clerkUserId: user.clerkUserId,
          providers,
          date,
          generateIfMissing: false,
        })

        delivered += 1
      } catch (error) {
        failed += 1
        console.error(
          `Daily summary generate/send failed for ${user.clerkUserId}:`,
          error
        )
      }
    }

    return {
      processed: users.length,
      generated,
      reused,
      delivered,
      failed,
      dateKey: this.getDateKey(date),
    }
  },

  async sendToLinkedApps({
    clerkUserId,
    providers,
    date = new Date(),
    generateIfMissing = false,
  }: {
    clerkUserId: string
    providers: AccountProvider[]
    date?: Date
    generateIfMissing?: boolean
  }) {
    const [{ user, summary, dateLabel }, clerkProfile] = await Promise.all([
      generateIfMissing
        ? this.generateForClerkUser(clerkUserId, { date })
        : this.getExistingForClerkUser(clerkUserId, { date }),
      getCurrentClerkUserProfile(),
    ])

    if (!summary) {
      throw new Error(
        'No daily summary has been generated for this day yet. Generate it first or let the cron job create it.'
      )
    }

    const recipientName = resolveRecipientName({
      fallbackUsername: clerkProfile?.username ?? null,
      firstName: clerkProfile?.firstName ?? null,
      githubUsername:
        user.linkedAccounts.find(
          (account) => account.provider === AccountProvider.GITHUB
        )?.username ?? null,
      telegramUsername:
        user.linkedAccounts.find(
          (account) => account.provider === AccountProvider.TELEGRAM
        )?.username ?? null,
      discordUsername:
        user.linkedAccounts.find(
          (account) => account.provider === AccountProvider.DISCORD
        )?.username ?? null,
    })

    const linkedTargets = user.linkedAccounts.filter(
      (account) => providers.includes(account.provider) && Boolean(account.chatId)
    )
    const timeZone = getDailySummaryTimezone()

    if (!linkedTargets.length) {
      throw new Error('No linked Telegram or Discord destination is available.')
    }

    const telegramText = formatTelegramDailySummaryMessage({
      recipientName,
      dateLabel,
      summary,
      timeZone,
    })
    const discordContent = formatDiscordDailySummaryMessage({
      recipientName,
      dateLabel,
      summary,
      timeZone,
    })
    const discordEmbeds = buildDiscordDailySummaryEmbeds({
      dateLabel,
      summary,
    })

    const deliveredProviders: AccountProvider[] = []

    for (const account of linkedTargets) {
      if (!account.chatId) {
        continue
      }

      if (account.provider === AccountProvider.TELEGRAM) {
        await sendTelegramMessage({
          chatId: account.chatId,
          text: telegramText,
          parseMode: 'HTML',
        })
        deliveredProviders.push(AccountProvider.TELEGRAM)
      }

      if (account.provider === AccountProvider.DISCORD) {
        const metadata =
          account.metadata && typeof account.metadata === 'object'
            ? (account.metadata as Record<string, unknown>)
            : {}
        const preferredChannelId =
          typeof metadata.dailySummaryChannelId === 'string'
            ? metadata.dailySummaryChannelId
            : null

        await sendDiscordMessage({
          channelId: preferredChannelId || account.chatId,
          content: discordContent,
          embeds: discordEmbeds,
        })
        deliveredProviders.push(AccountProvider.DISCORD)
      }
    }

    return {
      summary,
      deliveredProviders,
    }
  },
}
