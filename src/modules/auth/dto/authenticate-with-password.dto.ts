import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const authenticateWithPasswordBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export class AuthenticateWithPasswordDto extends createZodDto(
  authenticateWithPasswordBodySchema,
) {}
