import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { MOVIE_FILTER_COLUMNS } from '@/common/constants/app.constants'
import { PrismaService } from '@/database/prisma/prisma.service'

import { queryStringDto } from './dto/query-histories.dto'

@Injectable()
export class HistoriesService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(HistoriesService.name)

  async create(data: Prisma.HistoryUncheckedCreateInput) {
    const alreadyExists = await this.prisma.history.findUnique({
      where: { movieId_userId: { movieId: data.movieId, userId: data.userId } },
    })

    if (alreadyExists) {
      throw new ConflictException('Movie already added to user history')
    }

    return this.prisma.history.create({
      data,
    })
  }

  findAll() {
    return `This action returns all history`
  }

  findOne(id: number) {
    return `This action returns a #${id} history`
  }

  update(id: string, data: Prisma.HistoryUpdateInput) {
    return this.prisma.history.update({
      data,
      where: {
        id,
      },
    })
  }

  remove(userId: string) {
    return `This action removes a #${userId} history`
  }

  async fetchUserHistory(userId: string, params: queryStringDto) {
    try {
      const {
        page,
        sort_by,
        company_id,
        genre_id,
        person_id,
        release_year,
        watched_year,
      } = params

      const PAGE_SIZE = 20
      const skip = (page - 1) * PAGE_SIZE
      const take = PAGE_SIZE

      let orderBy: string = ''

      let conditions: string = ''

      if (sort_by) {
        const [column, direction] = sort_by.split('.')
        const columnName = MOVIE_FILTER_COLUMNS[column] as string

        switch (column) {
          case 'rating_imdb':
          case 'rating_tmdb':
          case 'rating_rotten':
          case 'rating_metacritic':
            orderBy = `mr.value ${direction}`
            conditions = conditions + `AND mr.rating_source = "${columnName}"`
            break
          case 'release_date':
            conditions = conditions + `AND mr.rating_source = "IMDB"`
            orderBy = `m.release_date ${direction}`
            break
          case 'watched_date':
            conditions = conditions + `AND mr.rating_source = "IMDB"`
            orderBy = `h.date ${direction}`
            break
          default:
            conditions = conditions + `AND mr.rating_source = "IMDB"`
            orderBy = `h.date desc`
        }
      }

      if (watched_year) {
        conditions = conditions + `AND YEAR(h.data) = "${watched_year}" `
      }

      if (release_year) {
        conditions = conditions + `AND YEAR(m.release_date) = "${watched_year}"`
      }

      if (genre_id) {
        conditions = conditions + `AND mg.genre_id = "${genre_id}" `
      }

      if (person_id) {
        conditions = conditions + `AND mp.person_id = "${person_id}" `
      }

      if (company_id) {
        conditions = conditions + `AND mc.company_id = "${company_id}"`
      }

      const query = `SELECT DISTINCT m.*, h.date, h.rating, mr.rating_source, mr.value FROM histories h JOIN movies m ON h.movie_id = m.id JOIN movie_ratings mr ON m.id = mr.movie_id LEFT JOIN movie_person mp ON m.id = mp.movie_id LEFT JOIN movie_genres mg ON m.id = mg.movie_id LEFT JOIN movie_companies mc ON m.id = mc.movie_id WHERE h.user_id = "${userId}" ${conditions} ORDER BY ${orderBy} LIMIT ${take} OFFSET ${skip}`

      this.logger.debug(query)

      const result = await this.prisma.$queryRawUnsafe(query)

      return result
    } catch (error) {
      return []
    }
  }
}
