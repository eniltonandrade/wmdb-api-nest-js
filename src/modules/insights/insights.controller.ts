import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'

import { CurrentUser } from '../auth/current-user.decorator'
import { UserPayload } from '../auth/jwt.strategy'
import {
  CompaniesStatsQueryParamsDto,
  companiesStatsQueryParamsSchema,
} from './dto/company-stats-query-params.dto'
import {
  GenreStatsQueryParamsDto,
  genreStatsQueryParamsSchema,
} from './dto/genre-stats-query-params.dto'
import {
  PeopleRankingQueryParamsDto,
  peopleRankingQueryParamsSchema,
} from './dto/people-ranking-query-params.dto'
import {
  PersonStatsQueryParamsDto,
  personStatsQueryParamsSchema,
} from './dto/person-stats-query-params.dto'
import {
  YearStatsQueryParamsDto,
  yearStatsQueryParamsSchema,
} from './dto/year-stats-query-params.dto'
import { InsightsService } from './insights.service'

@Controller('me/insights')
@ApiBearerAuth()
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  async getUserHistoryReport(@CurrentUser() user: UserPayload) {
    return await this.insightsService.getUserHistoryReport(user.sub)
  }

  @Get('/people')
  @ApiQuery({ name: 'sort_by', required: false, type: String })
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: Number })
  @ApiQuery({ name: 'id', required: false, type: String })
  @ApiQuery({ name: 'tmdb_id', required: false, type: Number })
  @ApiQuery({ name: 'selected_rating', required: false, type: String })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async getPersonStats(
    @CurrentUser() user: UserPayload,
    @Query(new ZodValidationPipe(personStatsQueryParamsSchema))
    query: PersonStatsQueryParamsDto,
  ) {
    return await this.insightsService.getPersonStats(user.sub, query)
  }

  @Get('/genres')
  @ApiQuery({ name: 'sort_by', required: false, type: String })
  @ApiQuery({ name: 'id', required: false, type: String })
  @ApiQuery({ name: 'tmdb_id', required: false, type: Number })
  @ApiQuery({ name: 'selected_rating', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async getGenresStats(
    @CurrentUser() user: UserPayload,
    @Query(new ZodValidationPipe(genreStatsQueryParamsSchema))
    query: GenreStatsQueryParamsDto,
  ) {
    return await this.insightsService.getGenresStats(user.sub, query)
  }

  @Get('/companies')
  @ApiQuery({ name: 'sort_by', required: false, type: String })
  @ApiQuery({ name: 'id', required: false, type: String })
  @ApiQuery({ name: 'tmdb_id', required: false, type: Number })
  @ApiQuery({ name: 'selected_rating', required: false, type: String })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async getCompaniesStats(
    @CurrentUser() user: UserPayload,
    @Query(new ZodValidationPipe(companiesStatsQueryParamsSchema))
    query: CompaniesStatsQueryParamsDto,
  ) {
    return await this.insightsService.getCompaniesStats(user.sub, query)
  }

  @Get('/watched-years')
  @ApiQuery({ name: 'sort_by', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: String })
  @ApiQuery({ name: 'selected_rating', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async getWatchedYearStats(
    @CurrentUser() user: UserPayload,
    @Query(new ZodValidationPipe(yearStatsQueryParamsSchema))
    query: YearStatsQueryParamsDto,
  ) {
    return await this.insightsService.getWatchedYearStats(user.sub, query)
  }

  @Get('/release-years')
  @ApiQuery({ name: 'sort_by', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: String })
  @ApiQuery({ name: 'selected_rating', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async getReleaseYearStats(
    @CurrentUser() user: UserPayload,
    @Query(new ZodValidationPipe(yearStatsQueryParamsSchema))
    query: YearStatsQueryParamsDto,
  ) {
    return await this.insightsService.getReleaseYearStats(user.sub, query)
  }

  @Get('/people/rankings')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: Number })
  async getRanking(
    @Query(new ZodValidationPipe(peopleRankingQueryParamsSchema))
    query: PeopleRankingQueryParamsDto,
    @CurrentUser()
    user: UserPayload,
  ) {
    return await this.insightsService.getCastRankingForUser(user.sub, query)
  }

  @Get('/retrospective/:year')
  @ApiParam({
    name: 'year',
    description: 'Year to get retrospective for',
    type: Number,
    required: true,
  })
  async getUserRetrospective(
    @CurrentUser() user: UserPayload,
    @Param('year') year: string,
  ) {
    return await this.insightsService.getUserRetrospective(user.sub, +year)
  }

  @Get('/people/:personId')
  async getPersonInsight(
    @CurrentUser() user: UserPayload,
    @Param('personId') personId: string,
  ) {
    const insight = await this.insightsService.getPersonInsight(
      user.sub,
      personId,
    )

    return insight
  }
}
