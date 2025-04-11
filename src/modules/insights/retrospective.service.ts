import { Injectable } from '@nestjs/common'
import { Kysely, sql } from 'kysely'
import { InjectKysely } from 'nestjs-kysely'
import { DB } from 'prisma/generated/types'

@Injectable()
export class RetrospectiveService {
  constructor(@InjectKysely() private readonly kysely: Kysely<DB>) {}

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
}
