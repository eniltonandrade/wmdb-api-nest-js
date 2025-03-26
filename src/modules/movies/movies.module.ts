import { Module } from '@nestjs/common'
import { DatabaseModule } from 'src/database/database.module'

import { MoviesController } from './movies.controller'
import { MoviesService } from './movies.service'

@Module({
  imports: [DatabaseModule],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
