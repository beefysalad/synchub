import { z } from 'zod'

export const githubThreadEditSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters.')
    .max(256, 'Title must be 256 characters or fewer.'),
  body: z
    .string()
    .trim()
    .min(3, 'Description must be at least 3 characters.')
    .max(20000, 'Description is too long.'),
})

export type GitHubThreadEditValues = z.infer<typeof githubThreadEditSchema>
