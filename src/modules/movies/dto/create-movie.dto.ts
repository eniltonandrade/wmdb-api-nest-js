import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const createMovieSchema = z.object({
  backdrop_path: z.string().nullable(),
  imdb_id: z.string(),
  original_title: z.string(),
  poster_path: z.string().nullable(),
  release_date: z.string(),
  runtime: z.number(),
  title: z.string(),
  tmdb_id: z.number(),
})

export class CreateMovieDTO extends createZodDto(createMovieSchema) {}
