import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'

import { CurrentUser } from '../auth/current-user.decorator'
import { UserPayload } from '../auth/jwt.strategy'
import { CompaniesInsightsService } from './companies-insights.service'
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
import { GenresInsightsService } from './genres-insights.service'
import { InsightsService } from './insights.service'
import { PeopleInsightsService } from './people-insights.service'
import { RetrospectiveService } from './retrospective.service'
import { YearsInsightsService } from './years-insights.service'

@Controller('me/insights')
@ApiBearerAuth()
export class InsightsController {
  constructor(
    private readonly insightsService: InsightsService,
    private readonly peopleInsightsService: PeopleInsightsService,
    private readonly retrospectiveService: RetrospectiveService,
    private readonly genresInsightsService: GenresInsightsService,
    private readonly companiesInsightsService: CompaniesInsightsService,
    private readonly yearsInsightsService: YearsInsightsService,
  ) {}

  @Get()
  async getUserHistoryReport(@CurrentUser() user: UserPayload) {
    return await this.insightsService.getUserHistoryReport(user.sub)
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
    return await this.genresInsightsService.getGenresInsights(user.sub, query)
  }

  @Get('/genres/:genreId')
  async getGenreInsight(
    @CurrentUser() user: UserPayload,
    @Param('genreId') genreId: string,
  ) {
    const insight = await this.genresInsightsService.getGenreInsight(
      user.sub,
      genreId,
    )

    return insight
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
    return await this.companiesInsightsService.getCompaniesInsights(
      user.sub,
      query,
    )
  }

  @Get('/companies/:companyId')
  async getCompanyInsight(
    @CurrentUser() user: UserPayload,
    @Param('companyId') companyId: string,
  ) {
    const insight = await this.companiesInsightsService.getCompanyInsight(
      user.sub,
      companyId,
    )

    return insight
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
    return await this.yearsInsightsService.getWatchedYearInsights(
      user.sub,
      query,
    )
  }

  @Get('/watched-years/:year')
  @ApiParam({
    name: 'year',
    description: 'Year to get watched insights for',
    type: String,
    required: true,
  })
  async getInsightByWatchedYear(
    @CurrentUser() user: UserPayload,
    @Param('year') year: string,
  ) {
    return await this.yearsInsightsService.getInsightsByYear({
      userId: user.sub,
      watchedYear: +year,
    })
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
    return await this.yearsInsightsService.getReleaseYearsInsights(
      user.sub,
      query,
    )
  }

  @Get('/release-years/:year')
  @ApiParam({
    name: 'year',
    description: 'Year to get watched insights for',
    type: String,
    required: true,
  })
  async getInsightByReleasedYear(
    @CurrentUser() user: UserPayload,
    @Param('year') year: string,
  ) {
    return await this.yearsInsightsService.getInsightsByYear({
      userId: user.sub,
      releaseYear: +year,
    })
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
    return await this.retrospectiveService.getUserRetrospective(user.sub, +year)
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
    return await this.peopleInsightsService.getCastRankingForUser(
      user.sub,
      query,
    )
  }

  @Get('/people/:personId')
  async getPersonInsight(
    @CurrentUser() user: UserPayload,
    @Param('personId') personId: string,
  ) {
    const insight = await this.peopleInsightsService.getPersonInsight(
      user.sub,
      personId,
    )

    return insight
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
    return await this.peopleInsightsService.getPeopleInsight(user.sub, query)
  }
}
