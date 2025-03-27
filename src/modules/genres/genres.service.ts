import { Injectable, NotFoundException } from '@nestjs/common'
import { Genre, Prisma } from '@prisma/client'
import { PrismaService } from 'src/database/prisma/prisma.service'

@Injectable()
export class GenresService {
  constructor(private prisma: PrismaService) {}

  async findOrCreate({
    name,
    tmdbId,
  }: Prisma.GenreCreateInput): Promise<Genre> {
    const genre = await this.prisma.genre.upsert({
      create: {
        name,
        tmdbId,
      },
      update: {},
      where: { tmdbId },
    })

    return genre
  }

  async findAll(): Promise<Genre[]> {
    return await this.prisma.genre.findMany()
  }

  async findOne(id: string): Promise<Genre> {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
    })

    if (!genre) {
      throw new NotFoundException(`Genre ${id} not found`)
    }

    return genre
  }

  async update(
    id: string,
    { name, tmdbId }: Prisma.GenreUpdateInput,
  ): Promise<void> {
    const genreExists = await this.prisma.genre.findUnique({
      where: { id },
    })

    if (!genreExists) {
      throw new NotFoundException(`Genre with TMDB ID ${tmdbId} not found`)
    }

    await this.prisma.genre.update({
      data: {
        name,
        tmdbId,
      },
      where: {
        id,
      },
    })
  }

  async remove(id: string): Promise<void> {
    await this.prisma.genre.delete({
      where: {
        id,
      },
    })
  }
}
