import { z } from 'zod'

import { createGenreSchema } from './create-genre.dto'

export const updateGenreSchema = createGenreSchema.partial()

export type UpdateGenreDto = z.infer<typeof updateGenreSchema>
