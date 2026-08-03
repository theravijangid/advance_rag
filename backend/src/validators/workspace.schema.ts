import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z
    .string({ message: 'Workspace name is required' })
    .trim()
    .min(1, 'Workspace name cannot be empty')
    .max(100, 'Workspace name cannot exceed 100 characters'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
})

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Workspace name cannot be empty')
    .max(100, 'Workspace name cannot exceed 100 characters')
    .optional(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
})

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>
