import { Module } from '@nestjs/common'

import { DatabaseModule } from '@/database/database.module'

import { UsersService } from '../users/users.service'
import { InsightsController } from './insights.controller'
import { InsightsService } from './insights.service'

@Module({
  imports: [DatabaseModule],
  controllers: [InsightsController],
  providers: [InsightsService, UsersService],
})
export class InsightsModule {}
