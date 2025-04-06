import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const yearStatsSortByOptionsSchema = z
  .enum([
    'average.desc',
    'average.asc',
    'count.asc',
    'count.desc',
    'year.asc',
    'year.desc',
  ])
  .default('year.desc')

const yearValidationSchema = z
  .string()
  .regex(/^\d{4}$/, 'Year must be a 4-digit number')
  .transform(Number) // Convert to a number after validation
  .refine((year) => year >= 1900 && year <= new Date().getFullYear(), {
    message: 'Year must be between 1900 and the current year',
  })
  .optional()

export const yearStatsQueryParamsSchema = z.object({
  sort_by: yearStatsSortByOptionsSchema,
  year: yearValidationSchema,
  query: yearValidationSchema,
  selected_rating: z
    .enum(['IMDB', 'TMDB', 'ROTTEN_TOMATOES', 'METACRITIC'])
    .optional()
    .nullable(),
  page: z.coerce.number().min(1).default(1),
})

export class YearStatsQueryParamsDto extends createZodDto(
  yearStatsQueryParamsSchema,
) {}
