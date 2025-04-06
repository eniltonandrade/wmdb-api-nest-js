import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const createTagSchema = z.object({
  color_hex: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, {
    message: 'Invalid hex color. Expected format: #RGB or #RRGGBB',
  }),
  name: z.string().min(2).max(20),
})

export class CreateTagDto extends createZodDto(createTagSchema) {}
