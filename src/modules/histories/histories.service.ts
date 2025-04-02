import { ConflictException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '@/database/prisma/prisma.service'

@Injectable()
export class HistoriesService {
  constructor(private prisma: PrismaService) {}

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

  async findOneByUserAndMovie(userId: string, movieId: string) {
    return await this.prisma.history.findUnique({
      select: {
        id: true,
        date: true,
        review: true,
        rating: true,
        tags: true,
      },
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    })
  }

  update(id: string, data: Prisma.HistoryUpdateInput) {
    return this.prisma.history.update({
      data,
      where: {
        id,
      },
    })
  }

  async remove(historyId: string) {
    return await this.prisma.history.delete({
      where: {
        id: historyId,
      },
    })
  }
}
