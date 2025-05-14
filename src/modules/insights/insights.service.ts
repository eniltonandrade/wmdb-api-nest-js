import { Injectable } from '@nestjs/common'
import { Kysely, sql } from 'kysely'
import { InjectKysely } from 'nestjs-kysely'
import { DB } from 'prisma/generated/types'

@Injectable()
export class InsightsService {
  constructor(@InjectKysely() private readonly kysely: Kysely<DB>) {}

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
      averageRating: Number(result?.average?.toFixed(1)) || 0,
      movieCount: result?.total || 0,
      totalRuntime: result?.totalRuntime || 0,
      activityByDayOfWeek,
    }
  }
}
