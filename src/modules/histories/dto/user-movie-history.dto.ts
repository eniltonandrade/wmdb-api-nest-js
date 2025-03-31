import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const userMovieHistory = z.object({
  id: z.string().uuid(),
  date: z.coerce.date(),
  review: z.string().optional().nullable(),
  rating: z.number().optional().nullable(),
  movie: z.object({
    backdrop_path: z.string().nullable(),
    imdb_id: z.string(),
    poster_path: z.string().nullable(),
    release_date: z.string(),
    title: z.string(),
    tmdb_id: z.number(),
    ratings: z.object({
      source: z.enum(['IMDB', 'TMDB', 'ROTTEN_TOMATOES', 'METACRITIC']),
      value: z.number(),
    }),
  }),
})

export class UserMovieHistoryDto extends createZodDto(userMovieHistory) {}
