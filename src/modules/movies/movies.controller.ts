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
    createMovieDTO: CreateMovieDTO,
  ) {
    const movie = await this.moviesService.create(createMovieDTO)
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
  async getByTmdbId(@Param('id') movieId: number) {
    const movie = await this.moviesService.getByTmdbId(movieId)

    return {
      result: movie,
    }
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMovieSchema))
    updateMovieDto: UpdateMovieDto,
  ) {
    return this.moviesService.update(id, updateMovieDto)
  }
}
