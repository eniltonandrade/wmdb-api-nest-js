import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const SortByOptionsSchema = z
  .enum([
    'release_date.asc',
    'release_date.desc',
    'watched_date.asc',
    'watched_date.desc',
    'rating_imdb.asc',
    'rating_imdb.desc',
    'rating_tmdb.asc',
    'rating_tmdb.desc',
    'rating_metacritic.asc',
    'rating_metacritic.desc',
    'rating_rotten.asc',
    'rating_rotten.desc',
    'rating_user.asc',
    'rating_user.desc',
  ])
  .default('watched_date.desc')

export const queryStringSchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    genre_id: z.string().uuid().optional(),
    person_id: z.string().uuid().optional(),
    company_id: z.string().uuid().optional(),
    release_year: z.string().optional(),
    watched_year: z.string().optional(),
    query: z.string().optional(),
    sort_by: SortByOptionsSchema,
  })
  .strict()

export class queryStringDto extends createZodDto(queryStringSchema) {}
