import { z } from 'zod'

export const githubCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty.')
    .max(20000, 'Comment is too long.'),
})

export type GitHubCommentValues = z.infer<typeof githubCommentSchema>
