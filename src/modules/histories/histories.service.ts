import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '@/database/prisma/prisma.service'

import { TagsService } from '../tags/tags.service'

@Injectable()
export class HistoriesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => TagsService))
    private readonly tagsService: TagsService,
  ) {}

  async create(data: Prisma.HistoryUncheckedCreateInput) {
    const alreadyExists = await this.prisma.history.findUnique({
      where: { movieId_userId: { movieId: data.movieId, userId: data.userId } },
    })

    if (alreadyExists) {
      throw new ConflictException('Movie already added to user history')
    }

    return this.prisma.history.create({
      select: {
        id: true,
      },
      data,
    })
  }

  async findOneByUserAndMovie(userId: string, movieId: string) {
    const convertedNumber = Number(movieId)
    const tmdbId = isNaN(convertedNumber) ? 0 : convertedNumber

    const history = await this.prisma.history.findFirst({
      select: {
        id: true,
        movieId: true,
        date: true,
        review: true,
        rating: true,
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                colorHex: true,
                name: true,
              },
            },
          },
        },
      },
      where: {
        userId,
        OR: [
          {
            movieId,
          },
          {
            movie: {
              tmdbId,
            },
          },
        ],
      },
    })

    if (!history) {
      return
    }

    return {
      ...history,
      tags: history?.tags.map((t) => t.tag),
    }
  }

  update(id: string, data: Prisma.HistoryUpdateInput) {
    return this.prisma.history.update({
      data,
      where: {
        id,
      },
    })
  }

  findOne(id: string) {
    return this.prisma.history.findUnique({
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

  async manageHistoryTags(userId: string, historyId: string, tagIds: string[]) {
    const existingTags = await this.tagsService.findMany(userId, tagIds)

    const existingTagIds = existingTags.map((tag) => tag.id)

    await this.prisma.tagsOnHistory.deleteMany({
      where: { historyId },
    })

    // Create new tag connections
    await this.prisma.tagsOnHistory.createMany({
      data: existingTagIds.map((tagId) => ({
        historyId,
        tagId,
      })),
      skipDuplicates: true,
    })
  }
}
