import { Module } from '@nestjs/common'

import { DatabaseModule } from '@/database/database.module'

import { PeopleController } from './people.controller'
import { PeopleService } from './people.service'

@Module({
  imports: [DatabaseModule],
  controllers: [PeopleController],
  providers: [PeopleService],
})
export class PeopleModule {}
