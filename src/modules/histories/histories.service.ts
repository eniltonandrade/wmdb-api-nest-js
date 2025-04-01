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
}
