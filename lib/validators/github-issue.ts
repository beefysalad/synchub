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

export const githubIssueAssigneesSchema = z.object({
  assignees: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Assignee login is required.')
        .regex(
          /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})?$/,
          'Each assignee must be a valid GitHub username.'
        )
    )
    .max(100, 'Keep the assignee list under 100 users.')
    .transform((assignees) =>
      Array.from(new Set(assignees.map((assignee) => assignee.trim())))
    ),
})

export type GitHubIssueAssigneesValues = z.infer<typeof githubIssueAssigneesSchema>
