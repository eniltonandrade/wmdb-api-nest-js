import { Module } from '@nestjs/common'

import { DatabaseModule } from '@/database/database.module'

import { PeopleModule } from '../people/people.module'
import { UsersService } from '../users/users.service'
import { InsightsController } from './insights.controller'
import { InsightsService } from './insights.service'

@Module({
  imports: [DatabaseModule, PeopleModule],
  controllers: [InsightsController],
  providers: [InsightsService, UsersService],
})
export class InsightsModule {}
