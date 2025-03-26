import { Injectable, NotFoundException } from '@nestjs/common'
import { Movie } from '@prisma/client'
import { PrismaService } from 'src/database/prisma/prisma.service'

import { CreateMovieDTO } from './dto/create-movie-dto'
import { UpdateMovieDto } from './dto/update-movie-dto'

@Injectable()
export class MoviesService {
  constructor(private prisma: PrismaService) {}

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

  async getByTmdbId(movieId: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { tmdbId: movieId },
    })

    if (!movie) {
      throw new NotFoundException(`Movie with TMDB ID ${movieId} not found`)
    }

    return movie
  }

  async create({
    backdrop_path,
    imdb_id,
    original_title,
    poster_path,
    release_date,
    runtime,
    title,
    tmdb_id,
  }: CreateMovieDTO) {
    const movieAlreadyExists = await this.prisma.movie.findUnique({
      where: { tmdbId: tmdb_id },
    })

    if (movieAlreadyExists) {
      return {
        created: false,
        id: movieAlreadyExists.id,
      }
    }

    const movie = await this.prisma.movie.create({
      data: {
        imdbId: imdb_id,
        originalTitle: original_title,
        releaseDate: release_date,
        title,
        tmdbId: tmdb_id,
        backdropPath: backdrop_path,
        posterPath: poster_path,
        runtime,
      },
    })

    return {
      created: true,
      id: movie?.id,
    }
  }

  async update(
    id: string,
    {
      backdrop_path,
      imdb_id,
      original_title,
      poster_path,
      release_date,
      runtime,
      title,
      tmdb_id,
      imdb_rating,
      metacritic_rating,
      rotten_tomatoes_rating,
      tmdb_rating,
    }: UpdateMovieDto,
  ) {
    const movieExists = await this.prisma.movie.findUnique({
      where: { id },
    })

    if (!movieExists) {
      throw new NotFoundException(`Movie with TMDB ID ${tmdb_id} not found`)
    }

    await this.prisma.movie.update({
      data: {
        backdropPath: backdrop_path,
        imdbId: imdb_id,
        originalTitle: original_title,
        posterPath: poster_path,
        releaseDate: release_date,
        runtime,
        title,
        tmdbId: tmdb_id,
        imdbRating: imdb_rating,
        metacriticRating: metacritic_rating,
        rottenTomatoesRating: rotten_tomatoes_rating,
        tmdbRating: tmdb_rating,
      },
      where: {
        id,
      },
    })
  }
}
