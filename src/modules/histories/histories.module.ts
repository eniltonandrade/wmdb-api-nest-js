import { Module } from '@nestjs/common'

import { DatabaseModule } from '@/database/database.module'

import { HistoriesController } from './histories.controller'
import { HistoriesService } from './histories.service'

@Module({
  imports: [DatabaseModule],
  controllers: [HistoriesController],
  providers: [HistoriesService],
})
export class HistoriesModule {}
