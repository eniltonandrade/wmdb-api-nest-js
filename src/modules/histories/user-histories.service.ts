import { Injectable } from '@nestjs/common'
import { RatingSource } from '@prisma/client'
import { Kysely, OrderByDirectionExpression } from 'kysely'
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres'
import { InjectKysely } from 'nestjs-kysely'
import { DB } from 'prisma/generated/types'

import {
  MOVIE_FILTER_COLUMNS,
  PAGE_SIZE,
} from '@/common/constants/app.constants'

import { UsersService } from '../users/users.service'
import { queryStringDto } from './dto/query-histories.dto'

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

  async fetchUserHistory(userId: string, params: queryStringDto) {
    const {
      page,
      sort_by,
      company_id,
      genre_id,
      person_id,
      release_year,
      watched_year,
      tag_id,
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
      case 'rating_user':
        orderBy = 'histories.rating'
        break
      case 'release_date':
        orderBy = 'movies.release_date'
        break
      case 'watched_date':
        orderBy = 'histories.date'
        break
      case 'average_rating':
        orderBy = 'movies.average_rating'
        break
      default:
        orderBy = 'histories.date'
    }

    const dbQuery = this.kysely
      .selectFrom('histories')
      .innerJoin('movies', 'movies.id', 'histories.movie_id')
      .innerJoin('movie_ratings', 'movie_ratings.movie_id', 'movies.id')
      .where('user_id', '=', userId)
      .$if(!!query, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb('movies.title', 'ilike', `%${query}%`),
            eb('movies.original_title', 'ilike', `%${query}%`),
          ]),
        ),
      )
      .$if(!!person_id, (qb) =>
        qb
          .innerJoin(
            'movie_person',
            'movie_person.movie_id',
            'histories.movie_id',
          )
          .where('movie_person.person_id', '=', person_id!),
      )
      .$if(!!tag_id, (qb) =>
        qb
          .innerJoin('history_tags', 'history_tags.history_id', 'histories.id')
          .where('history_tags.tag_id', '=', tag_id!),
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
          .where('movies.release_date', '>=', new Date(`${release_year}-01-01`))
          .where(
            'movies.release_date',
            '<=',
            new Date(`${Number(release_year) + 1}-01-01`),
          ),
      )
      .where('movie_ratings.rating_source', '=', selectedRatingSource)
      .$if(column === 'rating_user', (qb) =>
        qb.where('histories.rating', 'is not', null),
      )
      .select((eb) => [
        'histories.id',
        'histories.date',
        'histories.rating',
        'histories.review',
        'movies.average_rating',
        'movies.release_date',
        'movie_ratings.value',
        jsonObjectFrom(
          eb
            .selectFrom('movies')
            .selectAll()
            .select((eb) => [
              jsonArrayFrom(
                eb
                  .selectFrom('movie_ratings')
                  .select([
                    'movie_ratings.rating_source',
                    'movie_ratings.value',
                  ])
                  .whereRef('movie_ratings.movie_id', '=', 'movies.id'),
              ).as('ratings'),
            ])
            .$if(!!person_id, (qb) =>
              qb.select((eb) => [
                jsonArrayFrom(
                  eb
                    .selectFrom('movie_person')
                    .select(['movie_person.character', 'movie_person.role'])
                    .whereRef(
                      'movie_person.movie_id',
                      '=',
                      'histories.movie_id',
                    )
                    .where('movie_person.person_id', '=', person_id!),
                ).as('credits'),
              ]),
            )
            .whereRef('movies.id', '=', 'histories.movie_id'),
        ).as('movie'),
      ])
      .groupBy([
        'histories.id',
        'movies.id',
        'movie_ratings.value',
        'movie_ratings.movie_id',
        'movie_ratings.rating_source',
      ])
      .orderBy(orderBy, sortOrder)
      .as('histories')

    const totalCount = await this.kysely
      .selectFrom(dbQuery)
      .select(({ fn }) => fn.countAll<number>().as('total'))
      .executeTakeFirst()

    const results = await this.kysely
      .selectFrom(dbQuery)
      .selectAll()
      .limit(take)
      .offset(skip)
      .execute()

    return {
      total: totalCount?.total || 0,
      results,
    }
  }
}
