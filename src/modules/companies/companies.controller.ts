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
import { Company } from '@prisma/client'
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe'
import { ApiListResponseDto } from 'src/types/api-responses'

import { CompaniesService } from './companies.service'
import {
  AddCompanyToMovieDto,
  addCompanyToMovieSchema,
} from './dto/add-to-movie.dtos'
import { CreateCompanyDto, createCompanySchema } from './dto/create-company.dto'
import { UpdateCompanyDto, updateCompanySchema } from './dto/update-company.dto'

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiBearerAuth()
  @UsePipes(new ZodValidationPipe(createCompanySchema))
  async findOrCreate(@Body() body: CreateCompanyDto) {
    const { name, tmdb_id, logo_path } = body
    const company = await this.companiesService.findOrCreate({
      name,
      tmdbId: tmdb_id,
      logoPath: logo_path,
    })

    return {
      result: company,
    }
  }

  @Get()
  @ApiResponse({ status: 200, type: ApiListResponseDto<Company> })
  async findAll() {
    return await this.companiesService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.companiesService.findOne(id)
  }

  @Patch(':id')
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCompanySchema)) body: UpdateCompanyDto,
  ) {
    const { name, tmdb_id, logo_path } = body
    return await this.companiesService.update(id, {
      name,
      tmdbId: tmdb_id,
      logoPath: logo_path,
    })
  }

  @Delete(':id')
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    return await this.companiesService.remove(id)
  }

  @Post('/add-to-movie/:id')
  @ApiBearerAuth()
  @UsePipes(new ZodValidationPipe(addCompanyToMovieSchema))
  async addCompanyToMovie(
    @Param('id') movieId: string,
    @Body() body: AddCompanyToMovieDto,
  ) {
    const { company } = body
    return await this.companiesService.addCompanyToMovie(
      {
        name: company.name,
        tmdbId: company.tmdb_id,
        logoPath: company.logo_path,
      },
      movieId,
    )
  }
}
