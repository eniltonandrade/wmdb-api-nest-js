import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const statsSortByOptionsSchema = z
  .enum(['average.desc', 'average.asc', 'count.asc', 'count.desc'])
  .default('count.desc')

export const personStatsQueryParamsSchema = z.object({
  sort_by: statsSortByOptionsSchema,
  gender: z.coerce.number().optional(),
  role: z.enum(['cast', 'director', 'writer', 'producer']).optional(),
  id: z.string().optional(),
  query: z.string().optional(),
  tmdb_id: z.coerce.number().optional(),
  selected_rating: z
    .enum(['IMDB', 'TMDB', 'ROTTEN_TOMATOES', 'METACRITIC'])
    .optional()
    .nullable(),
  page: z.coerce.number().min(1).default(1),
})

export class PersonStatsQueryParamsDto extends createZodDto(
  personStatsQueryParamsSchema,
) {}
