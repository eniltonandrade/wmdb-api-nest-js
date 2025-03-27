import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe'

import { CreateMovieDTO, createMovieSchema } from './dto/create-movie-dto'
import { UpdateMovieDto, updateMovieSchema } from './dto/update-movie-dto'
import { MoviesService } from './movies.service'

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  async register(
    @Body(new ZodValidationPipe(createMovieSchema))
    body: CreateMovieDTO,
  ) {
    const {
      backdrop_path,
      imdb_id,
      original_title,
      poster_path,
      release_date,
      runtime,
      title,
      tmdb_id,
    } = body
    const movie = await this.moviesService.create({
      imdbId: imdb_id,
      originalTitle: original_title,
      releaseDate: release_date,
      title,
      tmdbId: tmdb_id,
      backdropPath: backdrop_path,
      posterPath: poster_path,
      runtime,
    })
    return {
      result: movie,
    }
  }

  @Get('/:id')
  async get(@Param('id') movieId: string) {
    const movie = await this.moviesService.get(movieId)

    return {
      result: movie,
    }
  }

  @Get('/tmdb/:id')
  async getByTmdbId(@Param('tmdb_id') movieId: number) {
    const movie = await this.moviesService.getByTmdbId(movieId)

    return {
      result: movie,
    }
  }

  @Patch(':id')
  async update(
    @Param('tmdb_id') tmdbId: string,
    @Body(new ZodValidationPipe(updateMovieSchema))
    body: UpdateMovieDto,
  ) {
    const {
      backdrop_path,
      imdb_id,
      original_title,
      poster_path,
      release_date,
      runtime,
      title,
      tmdb_id,
    } = body

    return await this.moviesService.update(+tmdbId, {
      imdbId: imdb_id,
      originalTitle: original_title,
      releaseDate: release_date,
      title,
      tmdbId: tmdb_id,
      backdropPath: backdrop_path,
      posterPath: poster_path,
      runtime,
    })
  }
}
