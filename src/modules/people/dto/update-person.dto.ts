import { createZodDto } from 'nestjs-zod'

import { personSchema } from './create-person.dto'

export const updatePersonSchema = personSchema.partial()

export class UpdatePersonDto extends createZodDto(updatePersonSchema) {}
