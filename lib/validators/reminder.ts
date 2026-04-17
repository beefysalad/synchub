import { z } from 'zod'

export const createReminderSchema = z.object({
  repository: z
    .string()
    .trim()
    .regex(/^[^/]+\/[^/]+$/, 'Repository must be in owner/repo format.'),
  issueNumber: z
    .number()
    .int()
    .positive('Issue number must be a positive integer.'),
  remindAt: z
    .string()
    .min(1, 'Choose when SyncHub should remind you.')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid reminder date.'),
  note: z
    .string()
    .trim()
    .max(500, 'Keep the note under 500 characters.')
    .optional()
    .or(z.literal('')),
})

export const updateReminderSchema = z.object({
  remindAt: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid reminder date.')
    .optional(),
  note: z.string().trim().max(500).nullable().optional(),
  status: z.enum(['PENDING', 'SENT', 'CANCELED', 'FAILED']).optional(),
  archived: z.boolean().optional(),
})

export type CreateReminderValues = z.infer<typeof createReminderSchema>
