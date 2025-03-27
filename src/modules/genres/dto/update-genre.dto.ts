import { createZodDto } from 'nestjs-zod'

import { createGenreSchema } from './create-genre.dto'

export const updateGenreSchema = createGenreSchema.partial()

export class UpdateGenreDto extends createZodDto(updateGenreSchema) {}
