import { z } from 'zod'

import { issueTemplates, type GitHubIssueTemplate } from '@/lib/github/issue-templates'

export const githubIssueTemplateSchema = z.enum(
  Object.keys(issueTemplates) as [GitHubIssueTemplate, ...GitHubIssueTemplate[]]
)

export const githubIssueFormSchema = z.object({
  template: githubIssueTemplateSchema,
  title: z
    .string()
    .trim()
    .min(5, 'Add a clear title with at least 5 characters.')
    .max(140, 'Keep the title under 140 characters.'),
  body: z
    .string()
    .trim()
    .min(20, 'Add a bit more detail so the issue is actionable.')
    .max(10000, 'Keep the description under 10,000 characters.'),
})

export type GitHubIssueFormValues = z.infer<typeof githubIssueFormSchema>
