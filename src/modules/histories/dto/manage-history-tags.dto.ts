import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const manageHistoryTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()),
})

export class ManageHistoryTagsDto extends createZodDto(
  manageHistoryTagsSchema,
) {}
