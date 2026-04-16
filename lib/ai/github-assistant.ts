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

const githubIssueDraftSchema = z.object({
  body: z.string().min(20).max(10000),
})

const githubDailySummarySchema = z.object({
  headline: z.string().min(1).max(140),
  overview: z.string().min(1).max(240),
  insights: z.array(z.string().min(1).max(220)).max(3),
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

function normalizeList(
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

export const githubAssistantService = {
  async summarizeDailyActivity({
    dateLabel,
    activities,
  }: {
    dateLabel: string
    activities: Array<{
      repository: string
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
      repositories?: Array<{
        repository?: string
        highlights?: string[]
      }>
    }>({
      prompt: [
        'You are a developer assistant writing a precise daily work summary.',
        `Create a professional recap for ${dateLabel}.`,
        'Use only the supplied activity. Do not invent work or generalize beyond what is present.',
        'Write complete, concrete sentences. Do not use ellipses.',
        'If a repository was created or first tracked today, explicitly mention that as a project kickoff or new project setup.',
        'For repository highlights, prefer exact actions such as merged PRs, opened issues, implemented features, bug fixes, and new project setup.',
        'For smart insights, synthesize 2-3 short observations about focus, momentum, or work patterns. Keep them specific and fully written, not cut off.',
        `Activity Context:\n${activityBlock}`,
      ].join('\n\n'),
      schemaDescription:
        '{"headline":"title","overview":"one sentence","insights":["analytical insight"],"repositories":[{"repository":"owner/repo","highlights":["accomplishment"]}]}',
      temperature: 0.2,
    })

    const sanitized = {
      headline: truncateText(
        result.headline?.trim() || `Daily summary for ${dateLabel}`,
        140
      ),
      overview: truncateText(
        result.overview?.trim() ||
          'A concise summary of repository activity for the day.',
        240
      ),
      insights: normalizeTextList(result.insights, {
        max: 3,
        fallback: ['Continued steady progress on current repository goals.'],
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
    repository,
    template,
    templateBody,
    title,
    currentBody,
  }: {
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
    })

    return githubIssueDraftSchema.parse(result)
  },

  async suggestIssueLabels({
    repository,
    availableLabels,
    template,
    title,
    body,
  }: {
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
    repository,
    issueNumber,
    title,
    body,
    comments,
  }: {
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
}
