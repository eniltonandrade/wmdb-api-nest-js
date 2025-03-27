import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'

import { CreateGenreDto } from './dto/create-genre.dto'
import { UpdateGenreDto } from './dto/update-genre.dto'
import { GenresService } from './genres.service'

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Post()
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
  async findAll() {
    const results = await this.genresService.findAll()
    return {
      results,
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.genresService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateGenreDto) {
    const { name, tmdb_id } = body
    return this.genresService.update(id, {
      name,
      tmdbId: tmdb_id,
    })
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.genresService.remove(id)
  }
}
