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

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

export const githubAssistantService = {
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
    const result = await generateGeminiJson<z.infer<typeof githubIssueDraftSchema>>({
      prompt: [
        'You are an expert engineering assistant drafting a GitHub issue body.',
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
    const allowedLabels = new Set(availableLabels.map((label) => label.toLowerCase()))

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

    const result = await generateGeminiJson<z.infer<typeof githubIssueSummarySchema>>({
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

    return githubIssueSummarySchema.parse(result)
  },
}
