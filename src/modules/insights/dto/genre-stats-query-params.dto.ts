import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const genreStatsSortByOptionsSchema = z
  .enum(['average.desc', 'average.asc', 'count.asc', 'count.desc', 'name.asc'])
  .default('name.asc')

export const genreStatsQueryParamsSchema = z.object({
  sort_by: genreStatsSortByOptionsSchema,
  selected_rating: z
    .enum(['IMDB', 'TMDB', 'ROTTEN_TOMATOES', 'METACRITIC'])
    .optional()
    .nullable(),
  page: z.coerce.number().min(1).default(1),
})

export class GenreStatsQueryParamsDto extends createZodDto(
  genreStatsQueryParamsSchema,
) {}
