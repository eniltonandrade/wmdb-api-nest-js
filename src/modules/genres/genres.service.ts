import { Injectable, NotFoundException } from '@nestjs/common'
import { Genre, Prisma } from '@prisma/client'

import { PrismaService } from '@/database/prisma/prisma.service'
import { ApiListResponseDto } from '@/types/api-responses'

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

  async findAll(): Promise<ApiListResponseDto<Genre>> {
    const [results, total] = await this.prisma.$transaction([
      this.prisma.genre.findMany(),
      this.prisma.genre.count(),
    ])
    return {
      total,
      results,
    }
  }

  async findOne(id: string): Promise<Genre> {
    const convertedNumber = Number(id)
    const tmdbId = isNaN(convertedNumber) ? 0 : convertedNumber

    const genre = await this.prisma.genre.findFirst({
      where: {
        OR: [
          {
            tmdbId,
          },
          { id },
        ],
      },
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

  async addGenreToMovie(
    genre: Prisma.GenreCreateInput,
    movieId: string,
  ): Promise<void> {
    const genreFoundOrCreated = await this.prisma.genre.upsert({
      where: {
        tmdbId: genre.tmdbId,
      },
      update: {},
      create: {
        name: genre.name,
        tmdbId: genre.tmdbId,
      },
    })

    const alreadyRelated = await this.prisma.genresOnMovies.findUnique({
      where: {
        genreId_movieId: {
          genreId: genreFoundOrCreated.id,
          movieId,
        },
      },
    })

    if (!alreadyRelated) {
      await this.prisma.genresOnMovies.create({
        data: {
          genreId: genreFoundOrCreated.id,
          movieId,
        },
      })
    }
  }
}
