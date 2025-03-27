import { Injectable, NotFoundException } from '@nestjs/common'
import { Movie, Prisma } from '@prisma/client'
import { PrismaService } from 'src/database/prisma/prisma.service'
import { ApiListResponseDto } from 'src/types/api-responses'

@Injectable()
export class MoviesService {
  constructor(private prisma: PrismaService) {}

  private async getMovieByTmdbId(tmdbId: number): Promise<Movie | null> {
    const movie = await this.prisma.movie.findUnique({
      where: { tmdbId },
    })

    return movie
  }

  async get(movieId: string): Promise<Movie> {
    const movie = await this.prisma.movie.findUnique({
      where: {
        id: movieId,
      },
    })

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`)
    }

    return movie
  }

  async getByTmdbId(movieId: number): Promise<Movie> {
    const movie = await this.prisma.movie.findUnique({
      where: { tmdbId: movieId },
    })

    if (!movie) {
      throw new NotFoundException(`Movie with TMDB ID ${movieId} not found`)
    }

    return movie
  }

  async findAll(): Promise<ApiListResponseDto<Movie>> {
    const [movies, count] = await this.prisma.$transaction([
      this.prisma.movie.findMany(),
      this.prisma.movie.count(),
    ])
    return {
      total: count,
      results: movies,
    }
  }

  async create(
    data: Prisma.MovieCreateInput,
  ): Promise<{ created: boolean; id: string }> {
    const movieAlreadyExists = await this.getMovieByTmdbId(data.tmdbId)

    if (movieAlreadyExists) {
      return {
        created: false,
        id: movieAlreadyExists.id,
      }
    }

    const movie = await this.prisma.movie.create({
      data: {
        ...data,
        releaseDate: new Date(data.releaseDate),
      },
    })

    return {
      created: true,
      id: movie?.id,
    }
  }

  async update(tmdbId: number, data: Prisma.MovieUpdateInput): Promise<void> {
    const movieExists = await this.getMovieByTmdbId(tmdbId)

    if (!movieExists) {
      throw new NotFoundException(`Movie with TMDB ID ${tmdbId} not found`)
    }

    await this.prisma.movie.update({
      data,
      where: {
        tmdbId,
      },
    })
  }
}
