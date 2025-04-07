import { Injectable } from '@nestjs/common'
import { RatingSource } from '@prisma/client'
import { Kysely, OrderByDirectionExpression, sql } from 'kysely'
import { InjectKysely } from 'nestjs-kysely'
import { DB } from 'prisma/generated/types'

import { PAGE_SIZE } from '@/common/constants/app.constants'

import { UsersService } from '../users/users.service'
import { CompaniesStatsQueryParamsDto } from './dto/company-stats-query-params.dto'
import { GenreStatsQueryParamsDto } from './dto/genre-stats-query-params.dto'
import { PeopleRankingQueryParamsDto } from './dto/people-ranking-query-params.dto'
import { PersonStatsQueryParamsDto } from './dto/person-stats-query-params.dto'
import { YearStatsQueryParamsDto } from './dto/year-stats-query-params.dto'

@Injectable()
export class ReportsService {
  constructor(
    @InjectKysely() private readonly kysely: Kysely<DB>,
    private usersService: UsersService,
  ) {}

  private async getQueryParams(
    page: number,
    sort_by: string,
    selected_rating:
      | 'IMDB'
      | 'TMDB'
      | 'ROTTEN_TOMATOES'
      | 'METACRITIC'
      | null
      | undefined,
    userId: string,
  ): Promise<{
    averageBy: 'movies.average_rating' | 'movie_ratings.value'
    column: string
    ratingSource: RatingSource
    skip: number
    sortOrder: OrderByDirectionExpression
    take: number
  }> {
    const user = await this.usersService.getPreferredRatingSource(userId)
    const { skip, take } = {
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }

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

    return {
      skip,
      take,
      column,
      sortOrder,
      averageBy,
      ratingSource,
    }
  }

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

    return {
      averageRating: Number(result?.average.toFixed(1)) || 0,
      count: Number(result?.total) || 0,
      totalRuntime: Number(result?.totalRuntime) || 0,
    }
  }

  async getPersonStats(userId: string, params: PersonStatsQueryParamsDto) {
    const { sort_by, selected_rating, gender, page, id, role, tmdb_id, query } =
      params

    const { averageBy, column, ratingSource, skip, sortOrder, take } =
      await this.getQueryParams(page, sort_by, selected_rating, userId)

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
        fn.count<number>('histories.id').as('appearances'),
        fn.avg<number>(averageBy).as('avgRating'),
      ])
      .whereRef('movie_person.movie_id', '=', 'histories.movie_id')
      .whereRef('histories.movie_id', '=', 'movie_ratings.movie_id')
      .whereRef('movie_person.person_id', '=', 'people.id')
      .whereRef('movie_person.movie_id', '=', 'movies.id')
      .where('user_id', '=', userId)
      .where('movie_ratings.rating_source', '=', ratingSource)
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
      .$if(!!gender, (qb) => qb.where('people.gender', '=', gender!))
      .$if(column === 'average', (qb) => qb.orderBy('avgRating', sortOrder))
      .$if(column === 'count', (qb) => qb.orderBy('appearances', sortOrder))
      .$if(column === 'average', (qb) =>
        qb.having((eb) => eb.fn.count('histories.id'), '>=', 5),
      )
      .groupBy([
        'people.id',
        'people.tmdb_id',
        'people.name',
        'people.profile_path',
      ])

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
        avgRating: Number(result.avgRating.toFixed(1)),
      })),
    }
  }

  async getGenresStats(userId: string, params: GenreStatsQueryParamsDto) {
    const { page, sort_by, id, selected_rating, tmdb_id } = params

    const { averageBy, column, ratingSource, skip, sortOrder, take } =
      await this.getQueryParams(page, sort_by, selected_rating, userId)

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
        fn.count<number>('histories.id').as('appearances'),
        fn.avg<number>(averageBy).as('avgRating'),
      ])
      .whereRef('movie_genres.movie_id', '=', 'histories.movie_id')
      .whereRef('histories.movie_id', '=', 'movie_ratings.movie_id')
      .whereRef('movie_genres.genre_id', '=', 'genres.id')
      .whereRef('movie_genres.movie_id', '=', 'movies.id')
      .where('movie_ratings.rating_source', '=', ratingSource)
      .where('user_id', '=', userId)
      .$if(!!id, (qb) => qb.where('genre_id', '=', id!))
      .$if(!!tmdb_id, (qb) => qb.where('genres.tmdb_id', '=', tmdb_id!))
      .$if(column === 'average', (qb) => qb.orderBy('avgRating', sortOrder))
      .$if(column === 'count', (qb) => qb.orderBy('appearances', sortOrder))
      .groupBy(['genres.id', 'genres.tmdb_id', 'genres.name'])

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
        avgRating: Number(result.avgRating.toFixed(1)),
      })),
    }
  }

  async getCompaniesStats(
    userId: string,
    params: CompaniesStatsQueryParamsDto,
  ) {
    const { page, sort_by, id, selected_rating, tmdb_id, query } = params

    const { averageBy, column, ratingSource, skip, sortOrder, take } =
      await this.getQueryParams(page, sort_by, selected_rating, userId)

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
        fn.count<number>('histories.id').as('appearances'),
        fn.avg<number>(averageBy).as('avgRating'),
      ])
      .whereRef('movie_companies.movie_id', '=', 'histories.movie_id')
      .whereRef('histories.movie_id', '=', 'movie_ratings.movie_id')
      .whereRef('movie_companies.company_id', '=', 'companies.id')
      .whereRef('movie_companies.movie_id', '=', 'movies.id')
      .where('user_id', '=', userId)
      .where('movie_ratings.rating_source', '=', ratingSource)
      .$if(!!query, (qb) => qb.where('companies.name', 'ilike', `%${query}%`))
      .$if(!!id, (qb) => qb.where('company_id', '=', id!))
      .$if(!!tmdb_id, (qb) => qb.where('companies.tmdb_id', '=', tmdb_id!))
      .$if(column === 'average', (qb) => qb.orderBy('avgRating', sortOrder))
      .$if(column === 'count', (qb) => qb.orderBy('appearances', sortOrder))
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

    const [{ total = 0 } = {}] = await this.kysely
      .selectFrom(subQuery)
      .select(({ fn }) => fn.countAll().as('total'))
      .execute()

    const results = await dbQuery.offset(skip).limit(take).execute()

    return {
      total,
      results: results.map((result) => ({
        ...result,
        avgRating: Number(result.avgRating.toFixed(1)),
      })),
    }
  }

  async getWatchedYearStats(userId: string, params: YearStatsQueryParamsDto) {
    const { page, sort_by, selected_rating, year, query } = params

    const { averageBy, column, ratingSource, skip, sortOrder, take } =
      await this.getQueryParams(page, sort_by, selected_rating, userId)

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
        avgRating: Number(result.avgRating.toFixed(1)),
      })),
    }
  }

  async getReleaseYearStats(userId: string, params: YearStatsQueryParamsDto) {
    const { page, sort_by, selected_rating, year, query } = params

    const { averageBy, column, ratingSource, skip, sortOrder, take } =
      await this.getQueryParams(page, sort_by, selected_rating, userId)

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

  async getCastRankingForUser(
    userId: string,
    params: PeopleRankingQueryParamsDto,
  ) {
    const { page, gender, role } = params

    const movieActors = await this.kysely
      .selectFrom('histories as h')
      .innerJoin('movies as m', 'm.id', 'h.movie_id')
      .innerJoin('movie_person as mp', 'mp.movie_id', 'm.id')
      .innerJoin('people as p', 'p.id', 'mp.person_id')
      .where('h.user_id', '=', userId)

      .$if(role === 'director', (qb) => qb.where('mp.role', 'in', ['DIRECTOR']))
      .$if(role === 'producer', (qb) => qb.where('mp.role', 'in', ['PRODUCER']))
      .$if(role === 'writer', (qb) => qb.where('mp.role', 'in', ['WRITER']))
      .$if(!!gender, (qb) => qb.where('p.gender', '=', gender!))
      .select([
        'm.id as movieId',
        'm.average_rating as averageRating',
        'p.id as personId',
        'p.name as personName',
        'p.profile_path as profilePath',
      ])
      .execute()

    if (movieActors.length === 0) {
      return {
        total: 0,
        results: [],
      }
    }

    const actorMap = new Map<
      string,
      {
        person: { id: string; name: string; profilePath: string | null }
        ratings: number[]
      }
    >()

    for (const row of movieActors) {
      if (!actorMap.has(row.personId)) {
        actorMap.set(row.personId, {
          person: {
            id: row.personId,
            name: row.personName,
            profilePath: row.profilePath,
          },
          ratings: [],
        })
      }

      actorMap.get(row.personId)!.ratings.push(row.averageRating)
    }

    const allRatings = movieActors.map((row) => row.averageRating)
    const C = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
    const m = 5

    const allActors = Array.from(actorMap.values()).map(
      ({ person, ratings }) => {
        const v = ratings.length
        const R = ratings.reduce((sum, r) => sum + r, 0) / v
        const score = (v / (v + m)) * R + (m / (v + m)) * C

        return {
          ...person,
          score: parseFloat(score.toFixed(2)),
          appearances: v,
          avgRating: parseFloat(R.toFixed(2)),
        }
      },
    )

    allActors.sort((a, b) => b.score - a.score)

    const total = allActors.length
    const start = (page - 1) * PAGE_SIZE
    const paginated = allActors.slice(start, start + PAGE_SIZE)

    return {
      total,
      results: paginated,
    }
  }

  async getUserRetrospective(userId: string, year: number) {
    const start = new Date(`${year}-01-01`)
    const end = new Date(`${year + 1}-01-01`)

    const [
      totalWatched,
      averageRatingData,
      mostActiveMonth,
      firstMovie,
      lastMovie,
      bestRated,
      worstRated,
      mostWatchedGenre,
      mostWatchedCompany,
      mostWatchedPerson,
    ] = await Promise.all([
      this.getTotalWatched(userId, start, end),
      this.getAverageRating(userId, start, end),
      this.getMostActiveMonth(userId, start, end),
      this.getFirstMovie(userId, start, end),
      this.getLastMovie(userId, start, end),
      this.getBestRated(userId, start, end),
      this.getWorstRated(userId, start, end),
      this.getMostWatchedGenre(userId, start, end),
      this.getMostWatchedCompany(userId, start, end),
      this.getMostWatchedPerson(userId, start, end),
    ])

    return {
      year,
      totalWatched: Number(totalWatched?.count ?? 0),
      averageRating: Number(averageRatingData?.average.toFixed(2) ?? 0),
      mostActiveMonth,
      firstMovie,
      lastMovie,
      bestRated,
      worstRated,
      mostWatchedGenre,
      mostWatchedPerson,
      mostWatchedCompany,
    }
  }

  private async getTotalWatched(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories as history')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('history.user_id', '=', userId)
      .where('history.date', '>=', start)
      .where('history.date', '<', end)
      .executeTakeFirst()
  }

  private async getAverageRating(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories as history')
      .innerJoin('movies', 'movies.id', 'history.movie_id')
      .select((eb) => eb.fn.count<number>('history.id').as('count'))
      .select((eb) => eb.fn.avg<number>('movies.average_rating').as('average'))
      .where('history.user_id', '=', userId)
      .where('history.date', '>=', start)
      .where('history.date', '<', end)
      .executeTakeFirst()
  }

  private async getMostActiveMonth(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories')
      .select((qb) => [
        sql<number>`extract(month from histories.date)`.as('month'),
        qb.fn.countAll<number>().as('count'),
      ])
      .where('histories.user_id', '=', userId)
      .where('histories.date', '>=', start)
      .where('histories.date', '<', end)
      .groupBy('month')
      .orderBy('count', 'desc')
      .limit(1)
      .executeTakeFirst()
  }

  private async getFirstMovie(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories')
      .innerJoin('movies', 'movies.id', 'histories.movie_id')
      .selectAll(['movies'])
      .select('histories.date as watchedDate')
      .where('histories.user_id', '=', userId)
      .where('histories.date', '>=', start)
      .where('histories.date', '<', end)
      .orderBy('histories.date', 'asc')
      .limit(1)
      .executeTakeFirst()
  }

  private async getLastMovie(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories')
      .innerJoin('movies', 'movies.id', 'histories.movie_id')
      .selectAll(['movies'])
      .select('histories.date as watchedDate')
      .where('histories.user_id', '=', userId)
      .where('histories.date', '>=', start)
      .where('histories.date', '<', end)
      .orderBy('histories.date', 'desc')
      .limit(1)
      .executeTakeFirst()
  }

  private async getBestRated(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories')
      .innerJoin('movies', 'movies.id', 'histories.movie_id')
      .selectAll(['movies'])
      .where('histories.user_id', '=', userId)
      .where('histories.date', '>=', start)
      .where('histories.date', '<', end)
      .orderBy('movies.average_rating', 'desc')
      .limit(1)
      .executeTakeFirst()
  }

  private async getWorstRated(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories')
      .innerJoin('movies', 'movies.id', 'histories.movie_id')
      .selectAll(['movies'])
      .where('histories.user_id', '=', userId)
      .where('histories.date', '>=', start)
      .where('histories.date', '<', end)
      .orderBy('movies.average_rating', 'asc')
      .limit(1)
      .executeTakeFirst()
  }

  private async getMostWatchedGenre(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories')
      .innerJoin('movie_genres', 'movie_genres.movie_id', 'histories.movie_id')
      .innerJoin('genres', 'genres.id', 'movie_genres.genre_id')
      .select(['genres.name', (eb) => eb.fn.count('genres.id').as('count')])
      .where('histories.user_id', '=', userId)
      .where('histories.date', '>=', start)
      .where('histories.date', '<', end)
      .groupBy('genres.id')
      .orderBy('count', 'desc')
      .limit(1)
      .executeTakeFirst()
  }

  private async getMostWatchedPerson(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories')
      .innerJoin('movie_person', 'movie_person.movie_id', 'histories.movie_id')
      .innerJoin('people', 'people.id', 'movie_person.person_id')
      .select(['people.name', (eb) => eb.fn.count('people.id').as('count')])
      .where('histories.user_id', '=', userId)
      .where('histories.date', '>=', start)
      .where('histories.date', '<', end)
      .where('movie_person.role', 'in', ['ACTOR', 'ACTRESS'])
      .groupBy(['people.id'])
      .orderBy('count', 'desc')
      .limit(1)
      .executeTakeFirst()
  }

  private async getMostWatchedCompany(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories')
      .innerJoin(
        'movie_companies',
        'movie_companies.movie_id',
        'histories.movie_id',
      )
      .innerJoin('companies', 'companies.id', 'movie_companies.company_id')
      .select([
        'companies.name',
        (eb) => eb.fn.count('companies.id').as('count'),
      ])
      .where('histories.user_id', '=', userId)
      .where('histories.date', '>=', start)
      .where('histories.date', '<', end)
      .groupBy(['companies.id'])
      .orderBy('count', 'desc')
      .limit(1)
      .executeTakeFirst()
  }
}
