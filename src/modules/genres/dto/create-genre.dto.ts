import { z } from 'zod'

export const createGenreSchema = z.object({
  name: z.string(),
  tmdb_id: z.number(),
})

export type CreateGenreDto = z.infer<typeof createGenreSchema>
