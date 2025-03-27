import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const createGenreSchema = z.object({
  name: z.string(),
  tmdb_id: z.number(),
})

export class CreateGenreDto extends createZodDto(createGenreSchema) {}
