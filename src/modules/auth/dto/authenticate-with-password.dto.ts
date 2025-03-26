import { z } from 'zod'

export const authenticateWithPasswordBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export type AuthenticateWithPasswordDto = z.infer<
  typeof authenticateWithPasswordBodySchema
>
