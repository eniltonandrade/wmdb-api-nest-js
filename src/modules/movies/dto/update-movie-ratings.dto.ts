import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const movieRatingsSchema = z.object({
  source: z.enum(['IMDB', 'TMDB', 'ROTTEN_TOMATOES', 'METACRITIC']),
  value: z.number(),
})

export const updateMovieRatingsSchema = z.object({
  ratings: z.array(movieRatingsSchema),
})

export class UpdateMovieRatingsDto extends createZodDto(
  updateMovieRatingsSchema,
) {}

export class MovieRatingsDto extends createZodDto(movieRatingsSchema) {}
