import { Injectable } from '@nestjs/common'
import { Kysely, sql } from 'kysely'
import { InjectKysely } from 'nestjs-kysely'
import { DB } from 'prisma/generated/types'

import { getQueryParams } from '@/helpers/get-query-params'

import { PeopleService } from '../people/people.service'
import { UsersService } from '../users/users.service'
import { GenreStatsQueryParamsDto } from './dto/genre-stats-query-params.dto'

@Injectable()
export class GenresInsightsService {
  constructor(
    @InjectKysely() private readonly kysely: Kysely<DB>,
    private usersService: UsersService,
    private peopleService: PeopleService,
  ) {}

  async getGenresInsights(userId: string, params: GenreStatsQueryParamsDto) {
    const { page, sort_by, selected_rating } = params

    const user = await this.usersService.getPreferredRatingSource(userId)

    const { averageBy, column, ratingSource, skip, sortOrder, take } =
      await getQueryParams(page, sort_by, selected_rating, user)

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

  async getGenreInsight(userId: string, genreId: string) {
    const [genre, data, frequentPeople, genreCountOverTheYear] =
      await Promise.all([
        this.getGenre(genreId),
        this.getGenreInsightData(userId, genreId),
        this.frequentPeopleInGenre(userId, genreId),
        this.getGenresOverTheYears(userId, genreId),
      ])

    return {
      genre,
      ...data,
      averageRating: Number(data?.averageRating?.toFixed(2)) || 0,
      frequentPeople,
      genreCountOverTheYear,
    }
  }

  private async getGenre(genreId: string) {
    return await this.kysely
      .selectFrom('genres')
      .selectAll()
      .where('id', '=', genreId)
      .executeTakeFirst()
  }

  private async getGenreInsightData(userId: string, genreId: string) {
    const query = this.kysely
      .selectFrom('histories')
      .innerJoin('movies', 'movies.id', 'histories.movie_id')
      .innerJoin('movie_genres', 'movie_genres.movie_id', 'movies.id')
      .select([
        'movies.id',
        'movies.average_rating',
        'movies.runtime',
        'movies.title',
        'movies.poster_path',
      ])
      .where('histories.user_id', '=', userId)
      .where('movie_genres.genre_id', '=', genreId)
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

  private async frequentPeopleInGenre(userId: string, genreId: string) {
    return await this.kysely
      .selectFrom('movie_person as pom')
      .innerJoin('histories as h', 'h.movie_id', 'pom.movie_id')
      .innerJoin('movie_genres as gom', 'gom.movie_id', 'pom.movie_id')
      .innerJoin('people as p', 'p.id', 'pom.person_id')
      .select([
        'p.id as id',
        'p.name as name',
        'pom.role as role',
        sql<number>`count(*)`.as('count'),
      ])
      .where('h.user_id', '=', userId)
      .where('gom.genre_id', '=', genreId)
      .groupBy(['p.id', 'p.name', 'pom.role'])
      .orderBy('count', 'desc')
      .limit(3)
      .execute()
  }

  private async getGenresOverTheYears(userId: string, genreId: string) {
    return await this.kysely
      .selectFrom('histories as h')
      .innerJoin('movie_genres as mg', 'h.movie_id', 'mg.movie_id')
      .select([
        sql<number>`extract(year from h.date)`.as('year'),
        sql<number>`count(*)`.as('count'),
      ])
      .where('h.user_id', '=', userId)
      .where('mg.genre_id', '=', genreId)
      .groupBy(['year'])
      .orderBy('year', 'asc')
      .execute()
  }
}
