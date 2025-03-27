import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const registerBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
})

export class RegisterDto extends createZodDto(registerBodySchema) {}
