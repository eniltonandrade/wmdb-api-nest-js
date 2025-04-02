import { Module } from '@nestjs/common'

import { DatabaseModule } from '@/database/database.module'

import { UsersService } from '../users/users.service'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'

@Module({
  imports: [DatabaseModule],
  controllers: [ReportsController],
  providers: [ReportsService, UsersService],
})
export class ReportsModule {}
