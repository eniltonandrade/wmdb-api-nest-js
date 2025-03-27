import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const personSchema = z.object({
  gender: z.number(),
  name: z.string(),
  profile_path: z.string().optional(),
  tmdb_id: z.number(),
})

export class CreatePersonDto extends createZodDto(personSchema) {}
