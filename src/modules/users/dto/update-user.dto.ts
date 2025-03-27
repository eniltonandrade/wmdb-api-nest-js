import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const updateUserBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable(),
  username: z.string().nullable(),
})

export class UpdateUserDto extends createZodDto(updateUserBodySchema) {}
