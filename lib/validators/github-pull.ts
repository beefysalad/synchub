import { z } from 'zod'

export const createGithubPullSchema = z.object({
  owner: z.string().trim().min(1, 'Owner is required.'),
  repo: z.string().trim().min(1, 'Repository is required.'),
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters.')
    .max(256, 'Title must be 256 characters or fewer.'),
  body: z
    .string()
    .trim()
    .max(20000, 'Description is too long.')
    .optional()
    .or(z.literal('')),
  head: z.string().trim().min(1, 'Head branch is required.'),
  base: z.string().trim().min(1, 'Base branch is required.'),
  draft: z.boolean().optional(),
})

export type CreateGithubPullValues = z.infer<typeof createGithubPullSchema>
