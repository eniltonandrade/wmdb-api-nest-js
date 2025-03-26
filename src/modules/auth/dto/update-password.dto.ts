import { z } from 'zod'

export const updatePasswordBodySchema = z.object({
  password: z.string().min(8),
})

export type UpdatePasswordDto = z.infer<typeof updatePasswordBodySchema>
