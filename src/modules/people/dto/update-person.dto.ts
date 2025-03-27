import { z } from 'zod'

import { personSchema } from './create-person.dto'

export const updatePersonSchema = personSchema.partial()

export type UpdatePersonDto = z.infer<typeof updatePersonSchema>
