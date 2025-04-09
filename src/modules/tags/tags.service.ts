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

  async create({ colorHex, name, userId }: Prisma.TagUncheckedCreateInput) {
    const tagExists = await this.prisma.tag.findFirst({
      where: {
        AND: [
          {
            name: { equals: name.trim(), mode: 'insensitive' },
          },
          {
            userId,
          },
        ],
      },
    })
    if (tagExists) {
      throw new ForbiddenException(`Tag ${name} already exists for this user`)
    }
    return await this.prisma.tag.create({
      select: {
        id: true,
        name: true,
        colorHex: true,
      },
      data: {
        colorHex,
        userId,
        name: name.trim(),
      },
    })
  }

  async findAll(userId: string) {
    return await this.prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        colorHex: true,
      },
      where: {
        userId,
      },
      orderBy: {
        name: 'asc',
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
    const tag = await this.prisma.tag.findUnique({
      where: {
        id,
      },
    })

    if (!tag) {
      throw new NotFoundException(`Tag ${id} not found`)
    }
    return tag
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

    await this.prisma.tag.delete({
      where: {
        id,
        userId,
      },
    })
  }
}
