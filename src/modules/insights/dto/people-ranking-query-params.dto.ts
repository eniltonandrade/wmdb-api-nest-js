import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const peopleRankingQueryParamsSchema = z.object({
  gender: z.coerce.number().optional(),
  role: z.enum(['cast', 'director', 'writer', 'producer']).optional(),
  page: z.coerce.number().min(1).default(1),
})

export class PeopleRankingQueryParamsDto extends createZodDto(
  peopleRankingQueryParamsSchema,
) {}
