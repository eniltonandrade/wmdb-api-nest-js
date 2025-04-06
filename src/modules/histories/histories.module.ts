import { Module } from '@nestjs/common'

import { DatabaseModule } from '@/database/database.module'

import { TagsModule } from '../tags/tags.module'
import { UsersService } from '../users/users.service'
import { HistoriesController } from './histories.controller'
import { HistoriesService } from './histories.service'
import { UserHistoriesService } from './user-histories.service'

@Module({
  imports: [DatabaseModule, TagsModule],
  controllers: [HistoriesController],
  providers: [HistoriesService, UserHistoriesService, UsersService],
  exports: [HistoriesService],
})
export class HistoriesModule {}
