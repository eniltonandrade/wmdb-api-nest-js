import { Module } from '@nestjs/common'

import { DatabaseModule } from '@/database/database.module'

import { HistoriesService } from '../histories/histories.service'
import { TagsController } from './tags.controller'
import { TagsService } from './tags.service'

@Module({
  imports: [DatabaseModule],
  controllers: [TagsController],
  providers: [TagsService, HistoriesService],
  exports: [TagsService],
})
export class TagsModule {}
