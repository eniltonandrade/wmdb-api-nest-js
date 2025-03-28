import { Module } from '@nestjs/common'

import { DatabaseModule } from '@/database/database.module'

import { CompaniesService } from '../companies/companies.service'
import { GenresService } from '../genres/genres.service'
import { PeopleService } from '../people/people.service'
import { MoviesController } from './movies.controller'
import { MoviesService } from './movies.service'

@Module({
  imports: [DatabaseModule],
  controllers: [MoviesController],
  providers: [MoviesService, PeopleService, CompaniesService, GenresService],
})
export class MoviesModule {}
