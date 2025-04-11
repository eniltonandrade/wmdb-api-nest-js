import { Module } from '@nestjs/common'

import { DatabaseModule } from '@/database/database.module'

import { PeopleModule } from '../people/people.module'
import { UsersService } from '../users/users.service'
import { CompaniesInsightsService } from './companies-insights.service'
import { GenresInsightsService } from './genres-insights.service'
import { InsightsController } from './insights.controller'
import { InsightsService } from './insights.service'
import { PeopleInsightsService } from './people-insights.service'
import { RetrospectiveService } from './retrospective.service'
import { YearsInsightsService } from './years-insights.service'

@Module({
  imports: [DatabaseModule, PeopleModule],
  controllers: [InsightsController],
  providers: [
    InsightsService,
    UsersService,
    PeopleInsightsService,
    RetrospectiveService,
    GenresInsightsService,
    CompaniesInsightsService,
    YearsInsightsService,
  ],
})
export class InsightsModule {}
