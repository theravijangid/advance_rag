import { z } from 'zod'

export const registerUrlSourceSchema = z.object({
  url: z
    .string({ message: 'URL is required' })
    .trim()
    .url('Invalid URL format'),
  name: z
    .string()
    .trim()
    .min(1, 'Source name cannot be empty')
    .max(150, 'Source name cannot exceed 150 characters')
    .optional(),
  type: z.enum(['website', 'youtube'], {
    message: 'URL source type must be website or youtube',
  }),
})

export type RegisterUrlSourceInput = z.infer<typeof registerUrlSourceSchema>
