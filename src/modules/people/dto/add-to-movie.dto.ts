import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

import { createPersonSchema } from './create-person.dto'

export const addPersonToMovieSchema = z.object({
  person: createPersonSchema,
  data: z.object({
    role: z.enum(['ACTOR', 'ACTRESS', 'DIRECTOR', 'WRITER', 'PRODUCER']),
    character: z.string().optional(),
    order: z.number().optional(),
  }),
})

export class AddPersonToMovieDto extends createZodDto(addPersonToMovieSchema) {}
