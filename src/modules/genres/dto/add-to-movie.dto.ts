import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

import { createGenreSchema } from './create-genre.dto'

export const addGenreToMovieSchema = z.object({
  genre: createGenreSchema,
})

export class AddGenreToMovieDto extends createZodDto(addGenreToMovieSchema) {}
