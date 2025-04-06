import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const companiesStatsSortByOptionsSchema = z
  .enum(['average.desc', 'average.asc', 'count.asc', 'count.desc', 'name.asc'])
  .default('name.asc')

export const companiesStatsQueryParamsSchema = z.object({
  sort_by: companiesStatsSortByOptionsSchema,
  id: z.string().optional(),
  tmdb_id: z.coerce.number().optional(),
  query: z.string().optional(),
  selected_rating: z
    .enum(['IMDB', 'TMDB', 'ROTTEN_TOMATOES', 'METACRITIC'])
    .optional()
    .nullable(),
  page: z.coerce.number().min(1).default(1),
})

export class CompaniesStatsQueryParamsDto extends createZodDto(
  companiesStatsQueryParamsSchema,
) {}
