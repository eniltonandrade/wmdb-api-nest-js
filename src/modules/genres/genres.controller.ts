import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { Person } from '@prisma/client'
import { ZodValidationPipe } from 'nestjs-zod'
import { ApiListResponseDto } from 'src/types/api-responses'

import { Public } from '../auth/public'
import {
  AddGenreToMovieDto,
  addGenreToMovieSchema,
} from './dto/add-to-movie.dto'
import { CreateGenreDto } from './dto/create-genre.dto'
import { UpdateGenreDto } from './dto/update-genre.dto'
import { GenresService } from './genres.service'

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Post()
  @ApiBearerAuth()
  async findOrCreate(@Body() body: CreateGenreDto) {
    const { name, tmdb_id } = body
    const genre = await this.genresService.findOrCreate({
      name,
      tmdbId: tmdb_id,
    })

    return {
      result: genre,
    }
  }

  @Get()
  @Public()
  @ApiResponse({ status: 200, type: ApiListResponseDto<Person> })
  async findAll() {
    return await this.genresService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.genresService.findOne(id)
  }

  @Patch(':id')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() body: UpdateGenreDto) {
    const { name, tmdb_id } = body
    return this.genresService.update(id, {
      name,
      tmdbId: tmdb_id,
    })
  }

  @Delete(':id')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.genresService.remove(id)
  }

  @Post('/add-to-movie/:id')
  @ApiBearerAuth()
  @UsePipes(new ZodValidationPipe(addGenreToMovieSchema))
  async addGenreToMovie(
    @Param('id') movieId: string,
    @Body() body: AddGenreToMovieDto,
  ) {
    const { genre } = body
    return await this.genresService.addGenreToMovie(
      {
        name: genre.name,
        tmdbId: genre.tmdb_id,
      },
      movieId,
    )
  }
}
