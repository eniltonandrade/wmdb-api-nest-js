import { Injectable } from '@nestjs/common'
import { Kysely, sql } from 'kysely'
import { InjectKysely } from 'nestjs-kysely'
import { DB } from 'prisma/generated/types'

import { PAGE_SIZE } from '@/common/constants/app.constants'
import { getQueryParams } from '@/helpers/get-query-params'

import { PeopleService } from '../people/people.service'
import { UsersService } from '../users/users.service'
import { PeopleRankingQueryParamsDto } from './dto/people-ranking-query-params.dto'
import { PersonStatsQueryParamsDto } from './dto/person-stats-query-params.dto'

@Injectable()
export class PeopleInsightsService {
  constructor(
    @InjectKysely() private readonly kysely: Kysely<DB>,
    private usersService: UsersService,
    private peopleService: PeopleService,
  ) {}

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

  async getPeopleInsight(userId: string, params: PersonStatsQueryParamsDto) {
    const { sort_by, selected_rating, gender, page, role, query } = params

    const user = await this.usersService.getPreferredRatingSource(userId)

    const { averageBy, column, ratingSource, skip, sortOrder, take } =
      await getQueryParams(page, sort_by, selected_rating, user)

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
      averageRating: Number(data?.averageRating?.toFixed(2)) || 0,
      moviesCountByRoles,
      favoriteGenre,
      favoriteCompany,
      frequentCollaborators,
    }
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
      .select([
        'movies.id',
        'movies.average_rating',
        'movies.runtime',
        'movies.title',
        'movies.poster_path',
      ])
      .where('histories.user_id', '=', userId)
      .where('movie_person.person_id', '=', personId)
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

    const highestRated = movieList.at(-1)
    const lowestRated = movieList.at(0)

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
      highestRated,
      lowestRated,
    }
  }
}
