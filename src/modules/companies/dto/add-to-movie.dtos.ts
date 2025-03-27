import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

import { createCompanySchema } from './create-company.dto'

export const addCompanyToMovieSchema = z.object({
  company: createCompanySchema,
})

export class AddCompanyToMovieDto extends createZodDto(
  addCompanyToMovieSchema,
) {}
