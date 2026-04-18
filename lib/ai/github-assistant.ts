import { z } from 'zod'

import { generateGeminiJson } from '@/lib/ai/gemini'

const githubLabelSuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      label: z.string().min(1),
      reason: z.string().min(1).max(160),
    })
  ),
})

const githubIssueSummarySchema = z.object({
  headline: z.string().min(1).max(140),
  summary: z.array(z.string().min(1).max(220)).min(2).max(4),
  risks: z.array(z.string().min(1).max(220)).max(3),
  nextSteps: z.array(z.string().min(1).max(220)).max(3),
})

const githubBranchSuggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        reason: z.string().min(1).max(160),
      })
    )
    .min(1)
    .max(4),
})

const githubIssueDraftSchema = z.object({
  body: z.string().min(20).max(10000),
})

const githubDailySummarySchema = z.object({
  headline: z.string().min(1).max(140),
  overview: z.string().min(1).max(240),
  insights: z.array(z.string().min(1).max(220)).max(3),
  delivered: z.array(z.string().min(1).max(220)).max(5),
  inProgress: z.array(z.string().min(1).max(220)).max(4),
  followUps: z.array(z.string().min(1).max(220)).max(4),
  repositories: z.array(
    z.object({
      repository: z.string().min(1),
      highlights: z.array(z.string().min(1).max(220)).min(1).max(5),
    })
  ),
})

function truncateText(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, ' ')

  if (normalized.length <= maxLength) {
    return normalized.replace(/\.{3,}$/g, '').trim()
  }

  const slice = normalized.slice(0, maxLength)
  const sentenceBoundary = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? ')
  )

  if (sentenceBoundary >= Math.floor(maxLength * 0.55)) {
    return slice.slice(0, sentenceBoundary + 1).trim()
  }

  const wordBoundary = slice.lastIndexOf(' ')
  const clipped =
    wordBoundary >= Math.floor(maxLength * 0.55)
      ? slice.slice(0, wordBoundary)
      : slice

  return clipped.replace(/[,:;\-–—\s.]+$/g, '').trim()
}

function normalizeTextList(
  values: string[] | undefined,
  {
    min = 0,
    max,
    fallback = [],
  }: {
    min?: number
    max: number
    fallback?: string[]
  }
) {
  const normalized = (values ?? [])
    .map((value) => truncateText(value.trim(), 220))
    .filter(Boolean)
    .slice(0, max)

  if (normalized.length >= min) {
    return normalized
  }

  return fallback.slice(0, max)
}

function sanitizeBranchName(value: string, issueNumber: number) {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/^[-/.]+|[-/.]+$/g, '')

  const parts = normalized.split('/').filter(Boolean)
  const prefix = parts[0] || 'chore'
  const suffix = parts.slice(1).join('-').replace(/\/+/g, '-') || `issue-${issueNumber}`
  const suffixWithIssue = suffix.includes(`${issueNumber}`)
    ? suffix
    : `${issueNumber}-${suffix}`

  return `${prefix}/${suffixWithIssue}`
    .replace(/-{2,}/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/^[-/.]+|[-/.]+$/g, '')
    .slice(0, 120)
}

function sanitizeDailySummaryHeadline(value: string, dateLabel: string) {
  const normalized = value.trim()
  const escapedDate = dateLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return normalized
    .replace(new RegExp(escapedDate, 'ig'), '')
    .replace(/^\s*(daily (work )?report|daily summary)\s*[:\-]?\s*/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s:,\-–—]+|[\s:,\-–—]+$/g, '')
}

export const githubAssistantService = {
  async summarizeDailyActivity({
    userId,
    dateLabel,
    activities,
  }: {
    userId: string
    dateLabel: string
    activities: Array<{
      repository: string
      stats: {
        commits: number
        pullRequests: number
        issues: number
      }
      trackingEvents: string[]
      commits: string[]
      pullRequests: Array<{ title: string; body?: string | null }>
      issues: Array<{ title: string; body?: string | null }>
    }>
  }) {
    const activityBlock = activities
      .map((activity) =>
        [
          `Repository: ${activity.repository}`,
          `Counts: ${activity.stats.commits} commits, ${activity.stats.pullRequests} pull requests created, ${activity.stats.issues} issues created`,
          `Repository lifecycle: ${
            activity.trackingEvents.length
              ? activity.trackingEvents.join(' | ')
              : 'None'
          }`,
          `Commits: ${activity.commits.length ? activity.commits.join(' | ') : 'None'}`,
          `Pull requests: ${
            activity.pullRequests.length
              ? activity.pullRequests
                  .map((pr) => `- ${pr.title}${pr.body ? `: ${pr.body}` : ''}`)
                  .join('\n')
              : 'None'
          }`,
          `Issues: ${
            activity.issues.length
              ? activity.issues
                  .map(
                    (issue) =>
                      `- ${issue.title}${issue.body ? `: ${issue.body}` : ''}`
                  )
                  .join('\n')
              : 'None'
          }`,
        ].join('\n')
      )
      .join('\n\n')

    const result = await generateGeminiJson<{
      headline?: string
      overview?: string
      insights?: string[]
      delivered?: string[]
      inProgress?: string[]
      followUps?: string[]
      repositories?: Array<{
        repository?: string
        highlights?: string[]
      }>
    }>({
      prompt: [
        'You are a developer assistant writing a concise but strong daily work report.',
        `Create a professional daily report for ${dateLabel}.`,
        'Use only the supplied activity. Do not invent work or generalize beyond what is present.',
        'Write complete, concrete sentences. Do not use ellipses.',
        'Make it read like a work report, not a chat message or motivational note.',
        'Prioritize outcomes, shipped work, meaningful progress, and follow-up items over raw activity counts.',
        'Do not repeat the full date in the headline, overview, or repository highlights because the date is already shown around the report.',
        'Do not use phrasing like "Today\'s work focused on" or "On [date]". Start directly with the substance of the report.',
        'Write smart insights in the second person when appropriate, such as "You demonstrated..." or "You maintained...". Avoid phrases like "The developer".',
        'Treat repository creation and SyncHub tracking as different concepts.',
        'Only describe a repository as a new project or kickoff when the activity context explicitly says it appears newly created today.',
        'If the context says the repository was newly tracked in SyncHub but already had prior GitHub history, describe it as an existing repository that was newly added to tracking, not as a new project.',
        'Treat the counts as factual context, but do not let them dominate the summary or insights.',
        'Do not spend the smart insights mostly repeating raw counts. Focus on the actual features, fixes, and progress those activities represent.',
        'Generate a real report structure: delivered work, in-progress work, and follow-ups or next actions.',
        'Put shipped, completed, merged, landed, or clearly finished work under delivered.',
        'Put active implementation, partially finished work, or still-open efforts under inProgress.',
        'Put bugs, polish items, remaining risks, or next actions under followUps.',
        'If there is not enough evidence for a section, return fewer bullets rather than inventing filler.',
        'For repository highlights, prefer exact actions such as shipped features, bug fixes, workflow improvements, and notable product or engineering progress.',
        'Avoid repeating the same activity twice in slightly different wording.',
        'For smart insights, synthesize 2-3 short observations about focus, momentum, or work patterns. Keep them specific and fully written, not cut off.',
        `Activity Context:\n${activityBlock}`,
      ].join('\n\n'),
      schemaDescription:
        '{"headline":"title","overview":"one sentence executive summary","insights":["analytical insight"],"delivered":["completed outcome"],"inProgress":["active work"],"followUps":["next action or remaining concern"],"repositories":[{"repository":"owner/repo","highlights":["accomplishment"]}]}',
      temperature: 0.2,
      userId,
    })

    const sanitized = {
      headline: truncateText(
        sanitizeDailySummaryHeadline(
          result.headline?.trim() || 'Daily work report',
          dateLabel
        ) || 'Daily work report',
        140
      ),
      overview: truncateText(
        result.overview?.trim() ||
          'Progress continued across tracked repositories with meaningful product and workflow updates.',
        240
      ),
      insights: normalizeTextList(result.insights, {
        max: 3,
        fallback: ['Continued steady progress on current repository goals.'],
      }),
      delivered: normalizeTextList(result.delivered, {
        max: 5,
      }),
      inProgress: normalizeTextList(result.inProgress, {
        max: 4,
      }),
      followUps: normalizeTextList(result.followUps, {
        max: 4,
      }),
      repositories: (result.repositories ?? [])
        .map((repository) => ({
          repository: repository.repository?.trim() ?? '',
          highlights: normalizeTextList(repository.highlights, {
            min: 1,
            max: 5,
            fallback: [
              'Worked on repository tasks captured in today’s activity.',
            ],
          }),
        }))
        .filter((repository) => repository.repository),
    }

    return githubDailySummarySchema.parse(sanitized)
  },

  async draftIssueBody({
    userId,
    repository,
    template,
    templateBody,
    title,
    currentBody,
  }: {
    userId: string
    repository: string
    template: string
    templateBody: string
    title: string
    currentBody: string
  }) {
    const result = await generateGeminiJson<
      z.infer<typeof githubIssueDraftSchema>
    >({
      prompt: [
        'You are an expert developer assistant drafting a GitHub issue body.',
        `Repository: ${repository}`,
        `Template type: ${template}`,
        `Issue title: ${title}`,
        `Template structure:\n${templateBody}`,
        `Current draft:\n${currentBody || 'No draft yet.'}`,
        'Produce a clearer, more actionable issue description.',
        'Preserve the intent of the selected template.',
        'Keep markdown headings and bullets practical and concise.',
        'Do not add filler text or vague corporate language.',
      ].join('\n\n'),
      schemaDescription: '{"body":"markdown issue description"}',
      temperature: 0.4,
      userId,
    })

    return githubIssueDraftSchema.parse(result)
  },

  async suggestIssueLabels({
    userId,
    repository,
    availableLabels,
    template,
    title,
    body,
  }: {
    userId: string
    repository: string
    availableLabels: string[]
    template: string
    title: string
    body: string
  }) {
    const result = await generateGeminiJson<{
      suggestions?: Array<{
        label?: string
        reason?: string
      }>
    }>({
      prompt: [
        'You are an expert GitHub issue triage assistant.',
        `Repository: ${repository}`,
        `Issue template: ${template}`,
        `Available labels: ${availableLabels.join(', ') || 'none'}`,
        `Issue title: ${title}`,
        `Issue body:\n${body}`,
        'Choose up to 3 labels from the available labels only.',
        'Do not invent labels. Prefer precision over coverage.',
        'Avoid contradictory labels.',
        'Keep each reason under 160 characters.',
      ].join('\n\n'),
      schemaDescription:
        '{"suggestions":[{"label":"string from available labels","reason":"short explanation"}]}',
      userId,
    })

    const sanitizedResult = {
      suggestions: (result.suggestions ?? [])
        .map((suggestion) => ({
          label: suggestion.label?.trim() ?? '',
          reason: truncateText(suggestion.reason?.trim() ?? '', 160),
        }))
        .filter((suggestion) => suggestion.label && suggestion.reason),
    }

    const parsed = githubLabelSuggestionsSchema.parse(sanitizedResult)
    const allowedLabels = new Set(
      availableLabels.map((label) => label.toLowerCase())
    )

    return parsed.suggestions.filter((suggestion) =>
      allowedLabels.has(suggestion.label.toLowerCase())
    )
  },

  async summarizeIssue({
    userId,
    repository,
    issueNumber,
    title,
    body,
    comments,
  }: {
    userId: string
    repository: string
    issueNumber: number
    title: string
    body: string
    comments: Array<{
      author: string
      body: string
      createdAt: string
    }>
  }) {
    const commentsBlock = comments.length
      ? comments
          .slice(0, 12)
          .map(
            (comment, index) =>
              `${index + 1}. ${comment.author} at ${comment.createdAt}: ${comment.body}`
          )
          .join('\n')
      : 'No comments yet.'

    const result = await generateGeminiJson<{
      headline?: string
      summary?: string[]
      risks?: string[]
      nextSteps?: string[]
    }>({
      prompt: [
        'You are an engineering project assistant summarizing a GitHub issue thread.',
        `Repository: ${repository}`,
        `Issue number: ${issueNumber}`,
        `Issue title: ${title}`,
        `Issue description:\n${body || 'No description provided.'}`,
        `Comments:\n${commentsBlock}`,
        'Write a concise, professional summary for developers.',
        'Focus on the core request, current state, risks, and concrete next steps.',
      ].join('\n\n'),
      schemaDescription:
        '{"headline":"short title","summary":["bullet"],"risks":["bullet"],"nextSteps":["bullet"]}',
      userId,
    })

    const sanitizedResult = {
      headline: truncateText(
        result.headline?.trim() || `Issue #${issueNumber} summary`,
        140
      ),
      summary: normalizeTextList(result.summary, {
        min: 2,
        max: 4,
        fallback: [
          'The issue needs a clearer summary from the current discussion.',
          'Generate the summary again after adding more issue context.',
        ],
      }),
      risks: normalizeTextList(result.risks, {
        max: 3,
      }),
      nextSteps: normalizeTextList(result.nextSteps, {
        max: 3,
      }),
    }

    return githubIssueSummarySchema.parse(sanitizedResult)
  },

  async suggestBranchNames({
    userId,
    repository,
    issueNumber,
    title,
    body,
    comments,
  }: {
    userId: string
    repository: string
    issueNumber: number
    title: string
    body: string
    comments: Array<{
      author: string
      body: string
      createdAt: string
    }>
  }) {
    const commentsBlock = comments.length
      ? comments
          .slice(0, 8)
          .map(
            (comment, index) =>
              `${index + 1}. ${comment.author} at ${comment.createdAt}: ${comment.body}`
          )
          .join('\n')
      : 'No comments yet.'

    const result = await generateGeminiJson<{
      suggestions?: Array<{
        name?: string
        reason?: string
      }>
    }>({
      prompt: [
        'You are an engineering assistant proposing standardized git branch names for GitHub issue work.',
        `Repository: ${repository}`,
        `Issue number: ${issueNumber}`,
        `Issue title: ${title}`,
        `Issue description:\n${body || 'No description provided.'}`,
        `Recent comments:\n${commentsBlock}`,
        'Return 3 branch name suggestions.',
        'Use concise, professional names that are easy to scan in pull requests.',
        'Prefer one of these prefixes when appropriate: feature, fix, chore, docs, refactor, test.',
        'Every suggestion must include the issue number and a short kebab-case slug.',
        'Keep each reason under 160 characters.',
      ].join('\n\n'),
      schemaDescription:
        '{"suggestions":[{"name":"feature/123-short-slug","reason":"why this name fits"}]}',
      temperature: 0.3,
      userId,
    })

    const sanitizedResult = {
      suggestions: (result.suggestions ?? [])
        .map((suggestion) => ({
          name: sanitizeBranchName(suggestion.name?.trim() ?? '', issueNumber),
          reason: truncateText(suggestion.reason?.trim() ?? '', 160),
        }))
        .filter((suggestion) => suggestion.name && suggestion.reason)
        .filter(
          (suggestion, index, suggestions) =>
            suggestions.findIndex((item) => item.name === suggestion.name) === index
        )
        .slice(0, 4),
    }

    if (!sanitizedResult.suggestions.length) {
      sanitizedResult.suggestions = [
        {
          name: sanitizeBranchName(`feature/${issueNumber}-${title}`, issueNumber),
          reason: 'Clear default branch name derived from the issue title.',
        },
      ]
    }

    return githubBranchSuggestionsSchema.parse(sanitizedResult)
  },
}
