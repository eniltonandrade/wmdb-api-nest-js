import { Injectable } from '@nestjs/common'
import { RatingSource } from '@prisma/client'
import { Kysely, OrderByDirectionExpression, sql } from 'kysely'
import { InjectKysely } from 'nestjs-kysely'
import { DB } from 'prisma/generated/types'

import { PAGE_SIZE } from '@/common/constants/app.constants'

import { UsersService } from '../users/users.service'
import { CompaniesStatsQueryParamsDto } from './dto/company-stats-query-params.dto'
import { GenreStatsQueryParamsDto } from './dto/genre-stats-query-params.dto'
import { PersonStatsQueryParamsDto } from './dto/person-stats-query-params.dto'
import { YearStatsQueryParamsDto } from './dto/year-stats-query-params.dto'

@Injectable()
export class ReportsService {
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
        sql<number>`CAST(AVG(movies.average_rating)::numeric AS decimal(4,1))`.as(
          'average',
        ),
      ])
      .whereRef('movies.id', '=', 'histories.movie_id')
      .where('user_id', '=', userId)
      .executeTakeFirst()

    return {
      average_rating: Number(result?.average) || 0,
      count: Number(result?.total) || 0,
      total_runtime: Number(result?.totalRuntime) || 0,
    }
  }

  async getPersonStats(userId: string, params: PersonStatsQueryParamsDto) {
    const { sort_by, selected_rating, gender, page, id, role, tmdb_id, query } =
      params
    const user = await this.usersService.getPreferredRatingSource(userId)

    const skip = (page - 1) * PAGE_SIZE
    const take = PAGE_SIZE

    const [column, direction] = sort_by.split('.')

    const sortOrder: OrderByDirectionExpression =
      direction as OrderByDirectionExpression

    const selectedRatingSource = selected_rating || 'AVERAGE'

    const averageBy =
      selectedRatingSource === 'AVERAGE'
        ? 'movies.average_rating'
        : 'movie_ratings.value'

    const ratingSource =
      selectedRatingSource === 'AVERAGE'
        ? (user?.preferredRating as RatingSource)
        : selectedRatingSource

    const dbQuery = this.kysely
      .selectFrom([
        'histories',
        'movie_ratings',
        'movie_person',
        'people',
        'movies',
      ])
      .select(({ fn }) => [
        'people.id',
        'people.tmdb_id',
        'people.name',
        'people.profile_path',
        fn.count<number>('histories.id').as('count'),
        fn.avg<number>(averageBy).as('average'),
      ])
      .whereRef('movie_person.movie_id', '=', 'histories.movie_id')
      .whereRef('histories.movie_id', '=', 'movie_ratings.movie_id')
      .whereRef('movie_person.person_id', '=', 'people.id')
      .whereRef('movie_person.movie_id', '=', 'movies.id')
      .where('user_id', '=', userId)
      .$if(!!query, (qb) => qb.where('people.name', 'ilike', `%${query}%`))
      .$if(role === 'cast', (qb) =>
        qb.where((eb) =>
          eb.and([
            eb('movie_person.role', 'in', ['ACTOR', 'ACTRESS']),
            eb('movie_person.order', '<=', 20),
          ]),
        ),
      )
      .$if(role === 'director', (qb) =>
        qb.where('movie_person.role', 'in', ['DIRECTOR']),
      )
      .$if(role === 'producer', (qb) =>
        qb.where('movie_person.role', 'in', ['PRODUCER']),
      )
      .$if(role === 'writer', (qb) =>
        qb.where('movie_person.role', 'in', ['WRITER']),
      )
      .$if(!!id, (qb) => qb.where('person_id', '=', id!))
      .$if(!!tmdb_id, (qb) => qb.where('people.tmdb_id', '=', tmdb_id!))
      .where('movie_ratings.rating_source', '=', ratingSource)
      .$if(!!gender, (qb) => qb.where('people.gender', '=', gender!))
      .$if(column === 'average', (qb) =>
        qb.orderBy('average', sortOrder).having('people.id', '>', '2'),
      )
      .$if(column === 'count', (qb) => qb.orderBy('count', sortOrder))
      .$if(column === 'average', (qb) =>
        qb.having((eb) => eb.fn.count('histories.id'), '>', 5),
      )
      .groupBy([
        'people.id',
        'people.tmdb_id',
        'people.name',
        'people.profile_path',
      ])

    const subQuery = dbQuery.as('sub_query')

    const totalCount = await this.kysely
      .selectFrom(subQuery)
      .select(({ fn }) => fn.countAll<number>().as('total'))
      .executeTakeFirst()

    const results = await dbQuery.offset(skip).limit(take).execute()

    if (results.length === 1 && id && tmdb_id && !query) {
      return {
        ...results[0],
        average: Number(results[0].average.toFixed(1)),
      }
    }

    return {
      total: totalCount?.total || 0,
      results: results.map((result) => ({
        ...result,
        average: Number(result.average.toFixed(2)),
      })),
    }
  }

  async getGenresStats(userId: string, params: GenreStatsQueryParamsDto) {
    const { page, sort_by, id, selected_rating, tmdb_id } = params

    const user = await this.usersService.getPreferredRatingSource(userId)

    const skip = (page - 1) * PAGE_SIZE
    const take = PAGE_SIZE

    const [column, direction] = sort_by.split('.')

    const sortOrder: OrderByDirectionExpression =
      direction as OrderByDirectionExpression

    const selectedRatingSource = selected_rating || 'AVERAGE'

    const averageBy =
      selectedRatingSource === 'AVERAGE'
        ? 'movies.average_rating'
        : 'movie_ratings.value'

    const ratingSource =
      selectedRatingSource === 'AVERAGE'
        ? (user?.preferredRating as RatingSource)
        : selectedRatingSource

    const dbQuery = this.kysely
      .selectFrom([
        'histories',
        'movie_ratings',
        'movie_genres',
        'genres',
        'movies',
      ])
      .select(({ fn }) => [
        'genres.id',
        'genres.tmdb_id',
        'genres.name',
        fn.count<number>('histories.id').as('count'),
        fn.avg<number>(averageBy).as('average'),
      ])
      .whereRef('movie_genres.movie_id', '=', 'histories.movie_id')
      .whereRef('histories.movie_id', '=', 'movie_ratings.movie_id')
      .whereRef('movie_genres.genre_id', '=', 'genres.id')
      .whereRef('movie_genres.movie_id', '=', 'movies.id')
      .where('user_id', '=', userId)
      .$if(!!id, (qb) => qb.where('genre_id', '=', id!))
      .$if(!!tmdb_id, (qb) => qb.where('genres.tmdb_id', '=', tmdb_id!))
      .where('movie_ratings.rating_source', '=', ratingSource)
      .$if(column === 'average', (qb) => qb.orderBy('average', sortOrder))
      .$if(column === 'count', (qb) => qb.orderBy('count', sortOrder))
      .groupBy(['genres.id', 'genres.tmdb_id', 'genres.name'])

    const subQuery = dbQuery.as('sub_query')

    const totalCount = await this.kysely
      .selectFrom(subQuery)
      .select(({ fn }) => fn.countAll<number>().as('total'))
      .executeTakeFirst()

    const results = await dbQuery.offset(skip).limit(take).execute()

    if (results.length === 1) {
      return {
        ...results[0],
        average: Number(results[0].average.toFixed(1)),
      }
    }

    return {
      total: totalCount?.total || 0,
      results: results.map((result) => ({
        ...result,
        average: Number(result.average.toFixed(1)),
      })),
    }
  }

  async getCompaniesStats(
    userId: string,
    params: CompaniesStatsQueryParamsDto,
  ) {
    const { page, sort_by, id, selected_rating, tmdb_id, query } = params

    const user = await this.usersService.getPreferredRatingSource(userId)

    const skip = (page - 1) * PAGE_SIZE
    const take = PAGE_SIZE

    const [column, direction] = sort_by.split('.')

    const sortOrder: OrderByDirectionExpression =
      direction as OrderByDirectionExpression

    const selectedRatingSource = selected_rating || 'AVERAGE'

    const averageBy =
      selectedRatingSource === 'AVERAGE'
        ? 'movies.average_rating'
        : 'movie_ratings.value'

    const ratingSource =
      selectedRatingSource === 'AVERAGE'
        ? (user?.preferredRating as RatingSource)
        : selectedRatingSource

    const dbQuery = this.kysely
      .selectFrom([
        'histories',
        'movie_ratings',
        'movie_companies',
        'companies',
        'movies',
      ])
      .select(({ fn }) => [
        'companies.id',
        'companies.tmdb_id',
        'companies.name',
        'companies.logo_path',
        fn.count<number>('histories.id').as('count'),
        fn.avg<number>(averageBy).as('average'),
      ])
      .whereRef('movie_companies.movie_id', '=', 'histories.movie_id')
      .whereRef('histories.movie_id', '=', 'movie_ratings.movie_id')
      .whereRef('movie_companies.company_id', '=', 'companies.id')
      .whereRef('movie_companies.movie_id', '=', 'movies.id')
      .$if(!!query, (qb) => qb.where('companies.name', 'ilike', `%${query}%`))
      .where('user_id', '=', userId)
      .$if(!!id, (qb) => qb.where('company_id', '=', id!))
      .$if(!!tmdb_id, (qb) => qb.where('companies.tmdb_id', '=', tmdb_id!))
      .where('movie_ratings.rating_source', '=', ratingSource)
      .$if(column === 'average', (qb) => qb.orderBy('average', sortOrder))
      .$if(column === 'count', (qb) => qb.orderBy('count', sortOrder))
      .$if(column === 'name', (qb) => qb.orderBy('companies.name', sortOrder))
      .$if(column === 'average', (qb) =>
        qb.having((eb) => eb.fn.count('histories.id'), '>', 2),
      )
      .groupBy([
        'companies.id',
        'companies.tmdb_id',
        'companies.name',
        'companies.logo_path',
      ])

    const subQuery = dbQuery.as('sub_query')

    const totalCount = await this.kysely
      .selectFrom(subQuery)
      .select(({ fn }) => fn.countAll<number>().as('total'))
      .executeTakeFirst()

    const results = await dbQuery.offset(skip).limit(take).execute()

    if (results.length === 1 && !query) {
      return {
        ...results[0],
        average: Number(results[0].average.toFixed(1)),
      }
    }

    return {
      total: totalCount?.total || 0,
      results: results.map((result) => ({
        ...result,
        average: Number(result.average.toFixed(1)),
      })),
    }
  }

  async getWatchedYearStats(userId: string, params: YearStatsQueryParamsDto) {
    const { page, sort_by, selected_rating, year, query } = params

    const user = await this.usersService.getPreferredRatingSource(userId)

    const skip = (page - 1) * PAGE_SIZE
    const take = PAGE_SIZE

    const [column, direction] = sort_by.split('.')

    const sortOrder: OrderByDirectionExpression =
      direction as OrderByDirectionExpression

    const selectedRatingSource = selected_rating || 'AVERAGE'

    const averageBy =
      selectedRatingSource === 'AVERAGE'
        ? 'movies.average_rating'
        : 'movie_ratings.value'

    const ratingSource =
      selectedRatingSource === 'AVERAGE'
        ? (user?.preferredRating as RatingSource)
        : selectedRatingSource

    const dbQuery = this.kysely
      .selectFrom(['histories', 'movies', 'movie_ratings'])
      .select(({ fn }) => [
        sql<number>`extract(year from histories.date)`.as('year'),
        fn.count<number>('histories.id').as('count'),
        fn.avg<number>(averageBy).as('average'),
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
      .$if(column === 'average', (qb) => qb.orderBy('average', sortOrder))
      .$if(column === 'count', (qb) => qb.orderBy('count', sortOrder))
      .$if(column === 'year', (qb) => qb.orderBy('year', sortOrder))
      .groupBy(['year'])

    const subQuery = dbQuery.as('sub_query')

    const totalCount = await this.kysely
      .selectFrom(subQuery)
      .select(({ fn }) => fn.countAll<number>().as('total'))
      .executeTakeFirst()

    const results = await dbQuery.offset(skip).limit(take).execute()

    if (results.length === 1 && !query) {
      return {
        ...results[0],
        average: Number(results[0].average.toFixed(1)),
      }
    }

    return {
      total: totalCount?.total || 0,
      results: results.map((result) => ({
        ...result,
        average: Number(result.average.toFixed(1)),
      })),
    }
  }

  async getReleaseYearStats(userId: string, params: YearStatsQueryParamsDto) {
    const { page, sort_by, selected_rating, year, query } = params

    const user = await this.usersService.getPreferredRatingSource(userId)

    const skip = (page - 1) * PAGE_SIZE
    const take = PAGE_SIZE

    const [column, direction] = sort_by.split('.')

    const sortOrder: OrderByDirectionExpression =
      direction as OrderByDirectionExpression

    const selectedRatingSource = selected_rating || 'AVERAGE'

    const averageBy =
      selectedRatingSource === 'AVERAGE'
        ? 'movies.average_rating'
        : 'movie_ratings.value'

    const ratingSource =
      selectedRatingSource === 'AVERAGE'
        ? (user?.preferredRating as RatingSource)
        : selectedRatingSource

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

    const totalCount = await this.kysely
      .selectFrom(subQuery)
      .select(({ fn }) => fn.countAll<number>().as('total'))
      .executeTakeFirst()

    const results = await dbQuery.offset(skip).limit(take).execute()

    if (results.length === 1 && !query) {
      return {
        ...results[0],
        average: Number(results[0].average.toFixed(1)),
      }
    }

    return {
      total: totalCount?.total || 0,
      results: results.map((result) => ({
        ...result,
        average: Number(result.average.toFixed(1)),
      })),
    }
  }
}
