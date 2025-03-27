import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const createCompanySchema = z.object({
  name: z.string(),
  tmdb_id: z.number(),
  logo_path: z.string().nullable(),
})

export class CreateCompanyDto extends createZodDto(createCompanySchema) {}
