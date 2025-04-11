import { Injectable } from '@nestjs/common'
import { Kysely, sql } from 'kysely'
import { InjectKysely } from 'nestjs-kysely'
import { DB } from 'prisma/generated/types'

import { getQueryParams } from '@/helpers/get-query-params'

import { UsersService } from '../users/users.service'
import { YearStatsQueryParamsDto } from './dto/year-stats-query-params.dto'

@Injectable()
export class InsightsService {
  constructor(
    @InjectKysely() private readonly kysely: Kysely<DB>,
    private usersService: UsersService,
  ) {}

  async getUserHistoryReport(userId: string) {
    const result = await this.kysely
      .selectFrom(['histories', 'movies'])
      .select(({ fn }) => [
        fn.count<number>('histories.id').as('total'),
        fn.sum<number>('movies.runtime').as('totalRuntime'),
        fn.avg<number>('movies.average_rating').as('average'),
      ])
      .whereRef('movies.id', '=', 'histories.movie_id')
      .where('user_id', '=', userId)
      .executeTakeFirst()

    const activityByDayOfWeek = await this.kysely
      .selectFrom('histories')
      .select([
        sql<number>`EXTRACT(DOW FROM date)::int`.as('weekday'),
        sql<number>`COUNT(*)`.as('count'),
      ])
      .where('histories.user_id', '=', userId)
      .groupBy('weekday')
      .orderBy('weekday')
      .execute()

    return {
      averageRating: Number(result?.average.toFixed(1)) || 0,
      movieCount: result?.total || 0,
      totalRuntime: result?.totalRuntime || 0,
      activityByDayOfWeek,
    }
  }

  async getReleaseYearStats(userId: string, params: YearStatsQueryParamsDto) {
    const { page, sort_by, selected_rating, year, query } = params

    const user = await this.usersService.getPreferredRatingSource(userId)

    const { averageBy, column, ratingSource, skip, sortOrder, take } =
      await getQueryParams(page, sort_by, selected_rating, user)

    const dbQuery = this.kysely
      .selectFrom(['histories', 'movies', 'movie_ratings'])
      .select(({ fn }) => [
        sql<number>`extract(year from movies.release_date)`.as('year'),
        fn.count<number>('histories.id').as('count'),
        fn.avg<number>(averageBy).as('average'),
      ])
      .whereRef('histories.movie_id', '=', 'movies.id')
      .whereRef('histories.movie_id', '=', 'movie_ratings.movie_id')
      .where('user_id', '=', userId)
      .where('movie_ratings.rating_source', '=', ratingSource)
      .$if(!!query, (qb) =>
        qb
          .where('movies.release_date', '>=', new Date(`${query}-01-01`))
          .where('release_date', '<=', new Date(`${Number(query) + 1}-01-01`)),
      )
      .$if(!!year, (qb) =>
        qb
          .where('movies.release_date', '>=', new Date(`${year}-01-01`))
          .where('release_date', '<=', new Date(`${Number(year) + 1}-01-01`)),
      )
      .$if(column === 'average', (qb) => qb.orderBy('average', sortOrder))
      .$if(column === 'count', (qb) => qb.orderBy('count', sortOrder))
      .$if(column === 'year', (qb) => qb.orderBy('year', sortOrder))
      .groupBy(['year'])

    const subQuery = dbQuery.as('sub_query')

    const [{ total = 0 } = {}] = await this.kysely
      .selectFrom(subQuery)
      .select(({ fn }) => fn.countAll().as('total'))
      .execute()

    const results = await dbQuery.offset(skip).limit(take).execute()

    return {
      total,
      results: results.map((result) => ({
        ...result,
        average: Number(result.average.toFixed(1)),
      })),
    }
  }
}
