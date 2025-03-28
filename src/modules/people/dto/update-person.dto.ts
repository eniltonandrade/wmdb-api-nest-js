import { createZodDto } from 'nestjs-zod'

import { createPersonSchema } from './create-person.dto'

export const updatePersonSchema = createPersonSchema.partial()

export class UpdatePersonDto extends createZodDto(createPersonSchema) {}
