import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { Movie } from '@prisma/client'

import { ZodValidationPipe } from '@/pipes/zod-validation.pipe'
import { ApiListResponseDto } from '@/types/api-responses'

import { Public } from '../auth/public'
import { CreateMovieDTO, createMovieSchema } from './dto/create-movie.dto'
import {
  CreateMovieRelationshipsDto,
  createMovieRelationshipsSchema,
} from './dto/create-movie-relationships.dto'
import { UpdateMovieDto, updateMovieSchema } from './dto/update-movie.dto'
import {
  UpdateMovieRatingsDto,
  updateMovieRatingsSchema,
} from './dto/update-movie-ratings.dto'
import { MoviesService } from './movies.service'

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @ApiBearerAuth()
  async findOrCreate(
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
    return await this.moviesService.get(movieId)
  }

  @Get('/tmdb/:id')
  async getByTmdbId(@Param('id') movieId: string) {
    return await this.moviesService.getByTmdbId(+movieId)
  }

  @Get()
  @Public()
  @ApiResponse({ status: 200, type: ApiListResponseDto<Movie> })
  async findAll(): Promise<ApiListResponseDto<Movie>> {
    return await this.moviesService.findAll()
  }

  @Patch(':id')
  @ApiBearerAuth()
  async update(
    @Param('id') tmdbId: string,
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

  @Post(':id/create-relations')
  @ApiBearerAuth()
  async createRelationShips(
    @Param('id') movieId: string,
    @Body(new ZodValidationPipe(createMovieRelationshipsSchema))
    body: CreateMovieRelationshipsDto,
  ) {
    return await this.moviesService.createMovieRelationships(movieId, body)
  }

  @Patch(':id/ratings')
  @ApiBearerAuth()
  async updateMovieRatings(
    @Param('id') movieId: string,
    @Body(new ZodValidationPipe(updateMovieRatingsSchema))
    body: UpdateMovieRatingsDto,
  ) {
    const { ratings } = body
    return await this.moviesService.updateMovieRating(movieId, ratings)
  }
}
