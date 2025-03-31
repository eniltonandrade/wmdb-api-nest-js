import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const createHistorySchema = z.object({
  movieId: z.string().uuid(),
  date: z.coerce.date(),
  review: z.string().optional(),
  rating: z.number().optional(),
})

export class CreateHistoryDto extends createZodDto(createHistorySchema) {}
