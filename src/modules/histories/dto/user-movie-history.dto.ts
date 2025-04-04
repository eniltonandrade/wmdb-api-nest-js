import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const userMovieHistory = z.object({
  id: z.string().uuid(),
  date: z.coerce.date(),
  review: z.string().optional().nullable(),
  rating: z.number().optional().nullable(),
  movie: z.object({
    backdropPath: z.string().nullable(),
    imdbId: z.string(),
    posterPath: z.string().nullable(),
    releaseDate: z.string(),
    title: z.string(),
    tmdbId: z.number(),
    ratings: z.array(
      z.object({
        ratingSource: z.string(),
        value: z.number(),
      }),
    ),
    credits: z
      .object({
        character: z.string().optional().nullable(),
        role: z.string(),
      })
      .optional()
      .nullable(),
  }),
})

export class UserMovieHistoryDto extends createZodDto(userMovieHistory) {}
