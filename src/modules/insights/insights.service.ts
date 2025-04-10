import { Injectable } from '@nestjs/common'
import { RatingSource } from '@prisma/client'
import { Kysely, OrderByDirectionExpression, sql } from 'kysely'
import { InjectKysely } from 'nestjs-kysely'
import { DB } from 'prisma/generated/types'

import { PAGE_SIZE } from '@/common/constants/app.constants'

import { PeopleService } from '../people/people.service'
import { UsersService } from '../users/users.service'
import { CompaniesStatsQueryParamsDto } from './dto/company-stats-query-params.dto'
import { GenreStatsQueryParamsDto } from './dto/genre-stats-query-params.dto'
import { PeopleRankingQueryParamsDto } from './dto/people-ranking-query-params.dto'
import { PersonStatsQueryParamsDto } from './dto/person-stats-query-params.dto'
import { YearStatsQueryParamsDto } from './dto/year-stats-query-params.dto'

@Injectable()
export class InsightsService {
  constructor(
    @InjectKysely() private readonly kysely: Kysely<DB>,
    private usersService: UsersService,
    private peopleService: PeopleService,
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
        qb.where('movie_person.role', 'in', ['ACTOR', 'ACTRESS']),
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
      .$if(column === 'name', (qb) => qb.orderBy('genres.name', sortOrder))
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

  async getPersonInsight(userId: string, personId: string) {
    const [
      person,
      data,
      moviesCountByRoles,
      favoriteGenre,
      favoriteCompany,
      frequentCollaborators,
    ] = await Promise.all([
      this.peopleService.findOne(personId),
      this.getPersonInsightData(userId, personId),
      this.getMovieCountByRole(userId, personId),
      this.getPersonFavoriteGenre(userId, personId),
      this.getPersonFavoriteCompany(userId, personId),
      this.getPersonFrequentCollaborators(userId, personId),
    ])

    return {
      person,
      ...data,
      averageRating: Number(data?.averageRating.toFixed(2)) || 0,
      moviesCountByRoles,
      favoriteGenre,
      favoriteCompany,
      frequentCollaborators,
    }
  }

  async getUserRetrospective(userId: string, year: number) {
    const start = new Date(`${year}-01-01`)
    const end = new Date(`${year + 1}-01-01`)

    const [
      movieData,
      activityByMonth,
      firstMovie,
      lastMovie,
      bestRated,
      worstRated,
      activityByGenre,
      mostWatchedCompany,
      mostWatchedPerson,
      activityByDayOfWeek,
    ] = await Promise.all([
      this.getAverageRating(userId, start, end),
      this.getQuantityByMonth(userId, start, end),
      this.getFirstMovie(userId, start, end),
      this.getLastMovie(userId, start, end),
      this.getBestRated(userId, start, end),
      this.getWorstRated(userId, start, end),
      this.getActivityByGenre(userId, start, end),
      this.getMostWatchedCompany(userId, start, end),
      this.getMostWatchedPerson(userId, start, end),
      this.getQuantityDayOfWeek(userId, start, end),
    ])

    return {
      year,
      movieData: {
        ...movieData,
        averageRating: Number(movieData?.averageRating.toFixed(2)) || 0,
      },
      activityByDayOfWeek,
      activityByMonth,
      firstMovie,
      lastMovie,
      bestRated,
      worstRated,
      activityByGenre,
      mostWatchedPerson,
      mostWatchedCompany,
    }
  }

  private async getAverageRating(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories as history')
      .innerJoin('movies', 'movies.id', 'history.movie_id')
      .select([
        (eb) => eb.fn.count<number>('history.id').as('totalWatched'),
        (eb) => eb.fn.sum<number>('movies.runtime').as('totalRuntime'),
        (eb) => eb.fn.avg<number>('movies.average_rating').as('averageRating'),
      ])
      .where('history.user_id', '=', userId)
      .where('history.date', '>=', start)
      .where('history.date', '<', end)
      .executeTakeFirst()
  }

  private async getQuantityByMonth(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories')
      .select((qb) => [
        sql<number>`extract(month from histories.date)::int`.as('month'),
        qb.fn.countAll<number>().as('count'),
      ])
      .where('histories.user_id', '=', userId)
      .where('histories.date', '>=', start)
      .where('histories.date', '<', end)
      .groupBy('month')
      .orderBy('month')
      .execute()
  }

  private async getQuantityDayOfWeek(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories')
      .select([
        sql<number>`EXTRACT(DOW FROM date)::int`.as('weekday'),
        sql<number>`COUNT(*)`.as('count'),
      ])
      .where('histories.user_id', '=', userId)
      .where('histories.date', '>=', start)
      .where('histories.date', '<', end)
      .groupBy('weekday')
      .orderBy('weekday')
      .execute()
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

  private async getActivityByGenre(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories')
      .innerJoin('movie_genres', 'movie_genres.movie_id', 'histories.movie_id')
      .innerJoin('genres', 'genres.id', 'movie_genres.genre_id')
      .select([
        'genres.id',
        'genres.name',
        (eb) => eb.fn.count('genres.id').as('count'),
      ])
      .where('histories.user_id', '=', userId)
      .where('histories.date', '>=', start)
      .where('histories.date', '<', end)
      .groupBy('genres.id')
      .orderBy('genres.name')
      .execute()
  }

  private async getMostWatchedPerson(userId: string, start: Date, end: Date) {
    return this.kysely
      .selectFrom('histories')
      .innerJoin('movie_person', 'movie_person.movie_id', 'histories.movie_id')
      .innerJoin('people', 'people.id', 'movie_person.person_id')
      .select([
        'people.name',
        'people.id',
        'people.tmdb_id',
        (eb) => eb.fn.count('people.id').as('count'),
      ])
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
        'companies.id',
        'companies.tmdb_id',
        'companies.logo_path',
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

  private async getMovieCountByRole(userId: string, personId: string) {
    return await this.kysely
      .selectFrom('histories')
      .innerJoin('movies', 'movies.id', 'histories.movie_id')
      .innerJoin('movie_person', 'movie_person.movie_id', 'movies.id')
      .select(['movie_person.role'])
      .select(({ fn }) => fn.count('movies.id').as('count'))
      .where('histories.user_id', '=', userId)
      .where('movie_person.person_id', '=', personId)
      .groupBy(['movie_person.role'])
      .execute()
  }

  private async getPersonFavoriteGenre(userId: string, personId: string) {
    const genresSubquery = this.kysely
      .selectFrom('histories')
      .innerJoin('movies', 'movies.id', 'histories.movie_id')
      .innerJoin('movie_person', 'movie_person.movie_id', 'movies.id')
      .innerJoin('movie_genres', 'movie_genres.movie_id', 'movies.id')
      .innerJoin('genres', 'movie_genres.genre_id', 'genres.id')
      .select(['movies.title', 'genres.id', 'genres.name'])
      .where('histories.user_id', '=', userId)
      .where('movie_person.person_id', '=', personId)
      .groupBy(['movies.title', 'genres.id', 'genres.name'])
      .distinct()
      .as('genres')

    return await this.kysely
      .selectFrom(genresSubquery)
      .select(({ fn }) => [
        'genres.id',
        'genres.name',
        fn.count('genres.name').as('count'),
      ])
      .orderBy('count', 'desc')
      .limit(1)
      .groupBy(['genres.id', 'genres.name'])
      .executeTakeFirst()
  }

  private async getPersonFavoriteCompany(userId: string, personId: string) {
    const companiesSubquery = this.kysely
      .selectFrom('histories')
      .innerJoin('movies', 'movies.id', 'histories.movie_id')
      .innerJoin('movie_person', 'movie_person.movie_id', 'movies.id')
      .innerJoin('movie_companies', 'movie_companies.movie_id', 'movies.id')
      .innerJoin('companies', 'movie_companies.company_id', 'companies.id')
      .select([
        'movies.title',
        'companies.id',
        'companies.name',
        'companies.logo_path',
      ])
      .where('histories.user_id', '=', userId)
      .where('movie_person.person_id', '=', personId)
      .groupBy([
        'movies.title',
        'companies.id',
        'companies.name',
        'companies.logo_path',
      ])
      .distinct()
      .as('companies')

    return await this.kysely
      .selectFrom(companiesSubquery)
      .select(({ fn }) => [
        'companies.id',
        'companies.name',
        'companies.logo_path',
        fn.count('companies.name').as('count'),
      ])
      .orderBy('count', 'desc')
      .limit(1)
      .groupBy(['companies.id', 'companies.name', 'companies.logo_path'])
      .executeTakeFirst()
  }

  private async getPersonFrequentCollaborators(
    userId: string,
    personId: string,
  ) {
    return await this.kysely
      .selectFrom('movie_person as p1')
      .innerJoin(
        'movie_person as p2',
        (join) =>
          join
            .onRef('p1.movie_id', '=', 'p2.movie_id')
            .onRef('p1.person_id', '!=', 'p2.person_id'), // exclude self
      )
      .innerJoin('people as collaborator', 'collaborator.id', 'p2.person_id')
      .select([
        'p2.person_id as id',
        'collaborator.name',
        'collaborator.profile_path',
        'p2.role',
        sql`COUNT(*)`.as('count'),
      ])
      .where('p1.person_id', '=', personId) // personId is the main person
      .groupBy([
        'p2.person_id',
        'collaborator.name',
        'collaborator.profile_path',
        'p2.role',
      ])
      .orderBy('count', 'desc')
      .limit(3)
      .execute()
  }

  private async getPersonInsightData(userId: string, personId: string) {
    const query = this.kysely
      .selectFrom('histories')
      .innerJoin('movies', 'movies.id', 'histories.movie_id')
      .innerJoin('movie_person', 'movie_person.movie_id', 'movies.id')
      .select(['movies.id', 'movies.average_rating', 'movies.runtime'])
      .where('histories.user_id', '=', userId)
      .where('movie_person.person_id', '=', personId)
      .groupBy(['movies.id', 'movies.average_rating', 'movies.runtime'])
      .distinct()
      .as('movies')

    return await this.kysely
      .selectFrom(query)
      .select(({ fn }) => [
        fn.countAll<number>().as('movieCount'),
        fn.avg<number>('movies.average_rating').as('averageRating'),
        fn.sum<number>('movies.runtime').as('totalRuntime'),
      ])
      .executeTakeFirst()
  }
}
