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
  imdb_rating: z.coerce.number().nullable().optional(),
  tmdb_rating: z.coerce.number().nullable().optional(),
  metacritic_rating: z.coerce.number().nullable().optional(),
  rotten_tomatoes_rating: z.coerce.number().nullable().optional(),
})

export class CreateMovieDTO extends createZodDto(createMovieSchema) {}
