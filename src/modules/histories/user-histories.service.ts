import { Injectable } from '@nestjs/common'
import { RatingSource } from '@prisma/client'
import { Kysely, OrderByDirectionExpression } from 'kysely'
import { InjectKysely } from 'nestjs-kysely'
import { DB } from 'prisma/generated/types'

import {
  MOVIE_FILTER_COLUMNS,
  PAGE_SIZE,
} from '@/common/constants/app.constants'
import { ApiListResponseDto } from '@/types/api-responses'

import { UsersService } from '../users/users.service'
import { queryStringDto } from './dto/query-histories.dto'
import { UserMovieHistoryDto } from './dto/user-movie-history.dto'

type PossibleOrderBy<
  Tables extends Record<string, unknown>,
  Table extends keyof Tables,
> =
  | `${Table & string}.${Extract<keyof Tables[Table], string>}` // Dot notation for joins
  | Extract<keyof Tables[Table], string> // Single table columns

type KSLOrderBy =
  | PossibleOrderBy<DB, 'movie_ratings'>
  | PossibleOrderBy<DB, 'movies'>
  | PossibleOrderBy<DB, 'histories'>
@Injectable()
export class UserHistoriesService {
  constructor(
    @InjectKysely() private readonly kysely: Kysely<DB>,
    private usersService: UsersService,
  ) {}

  async fetchUserHistory(
    userId: string,
    params: queryStringDto,
  ): Promise<ApiListResponseDto<UserMovieHistoryDto>> {
    try {
      const {
        page,
        sort_by,
        company_id,
        genre_id,
        person_id,
        release_year,
        watched_year,
        query,
      } = params

      const [column, direction] = sort_by.split('.')

      const skip = (page - 1) * PAGE_SIZE
      const take = PAGE_SIZE

      let orderBy: KSLOrderBy = 'histories.date'

      const sortOrder: OrderByDirectionExpression =
        direction as OrderByDirectionExpression

      const result = await this.usersService.getPreferredRatingSource(userId)

      let selectedRatingSource: RatingSource = result?.preferredRating || 'IMDB'

      switch (column) {
        case 'rating_imdb':
        case 'rating_tmdb':
        case 'rating_rotten':
        case 'rating_metacritic':
          orderBy = 'movie_ratings.value'
          selectedRatingSource = MOVIE_FILTER_COLUMNS[column] as RatingSource
          break
        case 'release_date':
          orderBy = 'movies.release_date'
          break
        case 'watched_date':
          orderBy = 'histories.date'
          break
        default:
          orderBy = 'histories.date'
      }

      const dbQuery = this.kysely
        .selectFrom('histories')
        .innerJoin('movies', 'movies.id', 'histories.movie_id')
        .innerJoin('movie_ratings', 'movie_ratings.movie_id', 'movies.id')
        .where('user_id', '=', userId)
        .$if(!!query, (qb) => qb.where('movies.title', 'like', `%${query}%`))
        .$if(!!person_id, (qb) =>
          qb
            .innerJoin(
              'movie_person',
              'movie_person.movie_id',
              'histories.movie_id',
            )
            .where('movie_person.person_id', '=', person_id!),
        )
        .$if(!!genre_id, (qb) =>
          qb
            .innerJoin(
              'movie_genres',
              'movie_genres.movie_id',
              'histories.movie_id',
            )
            .where('movie_genres.genre_id', '=', genre_id!),
        )
        .$if(!!company_id, (qb) =>
          qb
            .innerJoin(
              'movie_companies',
              'movie_companies.movie_id',
              'histories.movie_id',
            )
            .where('movie_companies.company_id', '=', company_id!),
        )
        .$if(!!watched_year, (qb) =>
          qb
            .where('histories.date', '>=', new Date(`${watched_year}-01-01`))
            .where(
              'histories.date',
              '<=',
              new Date(`${Number(watched_year) + 1}-01-01`),
            ),
        )
        .$if(!!release_year, (qb) =>
          qb
            .where(
              'movies.release_date',
              '>=',
              new Date(`${release_year}-01-01`),
            )
            .where(
              'movies.release_date',
              '<=',
              new Date(`${Number(release_year) + 1}-01-01`),
            ),
        )
        .where('movie_ratings.rating_source', '=', selectedRatingSource)
        .selectAll(['histories', 'movies', 'movie_ratings'])
        .orderBy(orderBy, sortOrder)
        .limit(take)
        .offset(skip)
        .distinct()

      const totalCount = await dbQuery
        .select(({ fn }) => fn.count<number>('histories.id').as('total'))
        .executeTakeFirst()

      const results = await dbQuery.execute()

      const mappedResults: UserMovieHistoryDto[] = results.map((record) => ({
        id: record.id,
        date: record.date,
        rating: record.rating,
        movie: {
          imdb_id: record.imdb_id,
          original_title: record.original_title,
          poster_path: record.poster_path,
          release_date: record.release_date.toISOString(),
          backdrop_path: record.backdrop_path,
          title: record.title,
          tmdb_id: record.tmdb_id,
          ratings: {
            source: record.rating_source,
            value: record.value,
          },
        },
      }))

      return {
        total: totalCount?.total || 0,
        results: mappedResults,
      }
    } catch (error) {
      return { total: 0, results: [] }
    }
  }
}
