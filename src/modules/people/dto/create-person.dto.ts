import { z } from 'zod'

export const personSchema = z.object({
  gender: z.number(),
  name: z.string(),
  profile_path: z.string().optional(),
  tmdb_id: z.number(),
})

export type CreatePersonDto = z.infer<typeof personSchema>
