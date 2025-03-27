import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const updatePasswordBodySchema = z.object({
  password: z.string().min(8),
})

export class UpdatePasswordDto extends createZodDto(updatePasswordBodySchema) {}
