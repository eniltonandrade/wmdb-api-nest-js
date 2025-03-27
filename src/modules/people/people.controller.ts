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

import {
  AddPersonToMovieDto,
  addPersonToMovieSchema,
} from './dto/add-to-movie.dto'
import { CreatePersonDto } from './dto/create-person.dto'
import { UpdatePersonDto } from './dto/update-person.dto'
import { PeopleService } from './people.service'

@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Post()
  @ApiBearerAuth()
  findOrCreate(@Body() body: CreatePersonDto) {
    const { gender, name, tmdb_id, profile_path } = body
    return this.peopleService.findOrCreate({
      name,
      tmdbId: tmdb_id,
      gender,
      profilePath: profile_path,
    })
  }

  @Get()
  @ApiResponse({ status: 200, type: ApiListResponseDto<Person> })
  async findAll() {
    return await this.peopleService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.peopleService.findOne(+id)
  }

  @Patch(':id')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() body: UpdatePersonDto) {
    const { gender, name, tmdb_id, profile_path } = body
    return this.peopleService.update(id, {
      name,
      tmdbId: tmdb_id,
      gender,
      profilePath: profile_path,
    })
  }

  @Delete(':id')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.peopleService.remove(id)
  }

  @Post('/add-to-movie/:id')
  @ApiBearerAuth()
  @UsePipes(new ZodValidationPipe(addPersonToMovieSchema))
  async addGenreToMovie(
    @Param('id') movieId: string,
    @Body() body: AddPersonToMovieDto,
  ) {
    const { data, person } = body
    return await this.peopleService.addPersonToMovie(
      {
        name: person.name,
        tmdbId: person.tmdb_id,
        gender: person.gender,
        profilePath: person.profile_path,
      },
      {
        movieId,
        role: data.role,
        character: data.character,
        order: data.order,
      },
    )
  }
}
