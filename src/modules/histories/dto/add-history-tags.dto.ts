import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const syncHistoryTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()),
})

export class SyncHistoryTagsDto extends createZodDto(syncHistoryTagsSchema) {}
