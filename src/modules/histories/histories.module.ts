import { Module } from '@nestjs/common'

import { DatabaseModule } from '@/database/database.module'

import { UsersService } from '../users/users.service'
import { HistoriesController } from './histories.controller'
import { HistoriesService } from './histories.service'
import { UserHistoriesService } from './user-histories.service'

@Module({
  imports: [DatabaseModule],
  controllers: [HistoriesController],
  providers: [HistoriesService, UserHistoriesService, UsersService],
})
export class HistoriesModule {}
