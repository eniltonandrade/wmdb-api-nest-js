import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const createMovieRelationshipsSchema = z.object({
  casts: z.object({
    cast: z.array(
      z.object({
        gender: z.number(),
        name: z.string(),
        profile_path: z.string().nullable(),
        id: z.number(),
        character: z.string(),
        order: z.number(),
      }),
    ),
    crew: z.array(
      z.object({
        gender: z.number(),
        id: z.number(),
        name: z.string(),
        profile_path: z.string().nullable(),
        job: z.string(),
      }),
    ),
  }),
  production_companies: z.array(
    z.object({
      name: z.string(),
      id: z.number(),
      logo_path: z.string().nullable(),
      origin_country: z.string(),
    }),
  ),
  genres: z.array(
    z.object({
      name: z.string(),
      id: z.number(),
    }),
  ),
  ratings: z.array(
    z.object({
      source: z.enum(['IMDB', 'TMDB', 'ROTTEN_TOMATOES', 'METACRITIC']),
      value: z.number(),
    }),
  ),
})

export class CreateMovieRelationshipsDto extends createZodDto(
  createMovieRelationshipsSchema,
) {}
