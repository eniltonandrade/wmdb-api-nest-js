import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '@/database/prisma/prisma.service'

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.TagUncheckedCreateInput) {
    return await this.prisma.tag.create({
      data,
    })
  }

  async findAll(userId: string) {
    return await this.prisma.tag.findMany({
      where: {
        userId,
      },
    })
  }

  async findMany(userId: string, tagIds: string[]) {
    return await this.prisma.tag.findMany({
      where: {
        AND: [
          {
            id: { in: tagIds },
          },
          {
            userId,
          },
        ],
      },
    })
  }

  async findOne(id: string) {
    return await this.prisma.tag.findUnique({
      where: {
        id,
      },
    })
  }

  async update(
    userId: string,
    id: string,
    { colorHex, name }: Prisma.TagUpdateInput,
  ) {
    const tag = await this.findOne(id)

    if (!tag) {
      throw new NotFoundException(`Tag ${name} not found for this user`)
    }

    if (tag.userId !== userId) {
      throw new ForbiddenException()
    }

    return await this.prisma.tag.update({
      data: {
        colorHex,
        name,
      },
      where: {
        id,
      },
    })
  }

  async remove(userId: string, id: string) {
    const tag = await this.findOne(id)

    if (!tag) {
      throw new NotFoundException(`Tag ${id} not found for this user`)
    }

    if (tag.userId !== userId) {
      throw new ForbiddenException()
    }

    return await this.prisma.tag.delete({
      where: {
        id,
      },
    })
  }
}
