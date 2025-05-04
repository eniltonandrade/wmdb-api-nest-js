import { Injectable } from '@nestjs/common'
import { Kysely, sql } from 'kysely'
import { InjectKysely } from 'nestjs-kysely'
import { DB } from 'prisma/generated/types'

import { getQueryParams } from '@/helpers/get-query-params'

import { UsersService } from '../users/users.service'
import { YearStatsQueryParamsDto } from './dto/year-stats-query-params.dto'

@Injectable()
export class YearsInsightsService {
  constructor(
    @InjectKysely() private readonly kysely: Kysely<DB>,
    private usersService: UsersService,
  ) {}

  async getReleaseYearsInsights(
    userId: string,
    params: YearStatsQueryParamsDto,
  ) {
    const { page, sort_by, selected_rating, year, query } = params

    const user = await this.usersService.getPreferredRatingSource(userId)

    const { averageBy, column, ratingSource, skip, sortOrder, take } =
      await getQueryParams(page, sort_by, selected_rating, user)

    const dbQuery = this.kysely
      .selectFrom(['histories', 'movies', 'movie_ratings'])
      .select(({ fn }) => [
        sql<number>`extract(year from movies.release_date)`.as('year'),
        fn.count<number>('histories.id').as('count'),
        fn.avg<number>(averageBy).as('avgRating'),
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
      .$if(column === 'average', (qb) => qb.orderBy('avgRating', sortOrder))
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
        year: +result.year,
        avgRating: Number(result.avgRating.toFixed(1)),
      })),
    }
  }

  async getWatchedYearInsights(
    userId: string,
    params: YearStatsQueryParamsDto,
  ) {
    const { page, sort_by, selected_rating, year, query } = params

    const user = await this.usersService.getPreferredRatingSource(userId)

    const { averageBy, column, ratingSource, skip, sortOrder, take } =
      await getQueryParams(page, sort_by, selected_rating, user)

    const dbQuery = this.kysely
      .selectFrom(['histories', 'movies', 'movie_ratings'])
      .select(({ fn }) => [
        sql<number>`extract(year from histories.date)`.as('year'),
        fn.count<number>('histories.id').as('count'),
        fn.avg<number>(averageBy).as('avgRating'),
      ])
      .whereRef('histories.movie_id', '=', 'movies.id')
      .whereRef('histories.movie_id', '=', 'movie_ratings.movie_id')
      .where('user_id', '=', userId)
      .where('movie_ratings.rating_source', '=', ratingSource)
      .$if(!!query, (qb) =>
        qb
          .where('histories.date', '>=', new Date(`${query}-01-01`))
          .where(
            'histories.date',
            '<=',
            new Date(`${Number(query) + 1}-01-01`),
          ),
      )
      .$if(!!year, (qb) =>
        qb
          .where('histories.date', '>=', new Date(`${year}-01-01`))
          .where('histories.date', '<=', new Date(`${Number(year) + 1}-01-01`)),
      )
      .$if(column === 'average', (qb) => qb.orderBy('avgRating', sortOrder))
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
        year: +result.year,
        avgRating: Number(result.avgRating.toFixed(1)),
      })),
    }
  }

  async getInsightsByYear({
    userId,
    releaseYear,
    watchedYear,
  }: {
    userId: string
    releaseYear?: number
    watchedYear?: number
  }) {
    const [data, frequentPeople, movieCountByMonth] = await Promise.all([
      this.getYearInsightData(userId, releaseYear, watchedYear),
      this.frequentPeopleInYear(userId, releaseYear, watchedYear),
      this.getMovieCountByMonth(userId, releaseYear, watchedYear),
    ])

    return {
      releaseYear,
      watchedYear,
      ...data,
      averageRating: Number(data?.averageRating?.toFixed(2)) || 0,
      frequentPeople,
      movieCountByMonth,
    }
  }

  private async getYearInsightData(
    userId: string,
    releaseYear?: number,
    watchedYear?: number,
  ) {
    const query = this.kysely
      .selectFrom('histories')
      .innerJoin('movies', 'movies.id', 'histories.movie_id')
      .select([
        'movies.id',
        'movies.average_rating',
        'movies.runtime',
        'movies.title',
        'movies.poster_path',
      ])
      .where('histories.user_id', '=', userId)
      .$if(!!releaseYear, (qb) =>
        qb
          .where('movies.release_date', '>=', new Date(`${releaseYear}-01-01`))
          .where(
            'movies.release_date',
            '<=',
            new Date(`${Number(releaseYear) + 1}-01-01`),
          ),
      )
      .$if(!!watchedYear, (qb) =>
        qb
          .where('histories.date', '>=', new Date(`${watchedYear}-01-01`))
          .where(
            'histories.date',
            '<=',
            new Date(`${Number(watchedYear) + 1}-01-01`),
          ),
      )
      .groupBy([
        'movies.id',
        'movies.average_rating',
        'movies.runtime',
        'movies.title',
        'movies.poster_path',
      ])
      .distinct()
      .as('movies')

    const movieList = await this.kysely
      .selectFrom(query)
      .selectAll()
      .orderBy('average_rating asc')
      .execute()

    const highestRatedMovie = movieList.at(-1)
    const lowestRatedMovie = movieList.at(0)

    const statistics = await this.kysely
      .selectFrom(query)
      .select(({ fn }) => [
        fn.countAll<number>().as('movieCount'),
        fn.avg<number>('movies.average_rating').as('averageRating'),
        fn.sum<number>('movies.runtime').as('totalRuntime'),
      ])
      .executeTakeFirst()

    return {
      ...statistics,
      highestRatedMovie,
      lowestRatedMovie,
    }
  }

  private async frequentPeopleInYear(
    userId: string,
    releaseYear?: number,
    watchedYear?: number,
  ) {
    return await this.kysely
      .selectFrom('movie_person')
      .innerJoin('histories', 'histories.movie_id', 'movie_person.movie_id')
      .innerJoin('movies', 'movies.id', 'movie_person.movie_id')
      .innerJoin('people', 'people.id', 'movie_person.person_id')
      .select([
        'people.id as id',
        'people.name as name',
        'movie_person.role as role',
        sql<number>`count(*)`.as('count'),
      ])
      .where('histories.user_id', '=', userId)
      .$if(!!releaseYear, (qb) =>
        qb
          .where('movies.release_date', '>=', new Date(`${releaseYear}-01-01`))
          .where(
            'movies.release_date',
            '<=',
            new Date(`${Number(releaseYear) + 1}-01-01`),
          ),
      )
      .$if(!!watchedYear, (qb) =>
        qb
          .where('histories.date', '>=', new Date(`${watchedYear}-01-01`))
          .where(
            'histories.date',
            '<=',
            new Date(`${Number(watchedYear) + 1}-01-01`),
          ),
      )
      .groupBy(['people.id', 'people.name', 'movie_person.role'])
      .orderBy('count', 'desc')
      .limit(3)
      .execute()
  }

  private async getMovieCountByMonth(
    userId: string,
    releaseYear?: number,
    watchedYear?: number,
  ) {
    return await this.kysely
      .selectFrom('histories')
      .innerJoin('movies', 'histories.movie_id', 'movies.id')
      .select([
        sql<number>`EXTRACT(MONTH FROM date)::int`.as('month'),
        sql<number>`COUNT(*)`.as('count'),
      ])
      .where('histories.user_id', '=', userId)
      .$if(!!releaseYear, (qb) =>
        qb
          .where('movies.release_date', '>=', new Date(`${releaseYear}-01-01`))
          .where(
            'movies.release_date',
            '<=',
            new Date(`${Number(releaseYear) + 1}-01-01`),
          ),
      )
      .$if(!!watchedYear, (qb) =>
        qb
          .where('histories.date', '>=', new Date(`${watchedYear}-01-01`))
          .where(
            'histories.date',
            '<=',
            new Date(`${Number(watchedYear) + 1}-01-01`),
          ),
      )
      .groupBy(['month'])
      .orderBy('month', 'asc')
      .execute()
  }
}
