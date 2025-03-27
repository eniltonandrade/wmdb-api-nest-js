import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'

import { CreatePersonDto } from './dto/create-person.dto'
import { UpdatePersonDto } from './dto/update-person.dto'
import { PeopleService } from './people.service'

@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Post()
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
  findAll() {
    return this.peopleService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.peopleService.findOne(+id)
  }

  @Patch(':id')
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
  remove(@Param('id') id: string) {
    return this.peopleService.remove(id)
  }
}
