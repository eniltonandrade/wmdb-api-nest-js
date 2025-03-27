import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'

import { CompaniesService } from './companies.service'
import { CreateCompanyDto } from './dto/create-company.dto'
import { UpdateCompanyDto } from './dto/update-company.dto'

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
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
  async findAll() {
    const results = await this.companiesService.findAll()
    return {
      results,
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCompanyDto) {
    const { name, tmdb_id, logo_path } = body
    return this.companiesService.update(id, {
      name,
      tmdbId: tmdb_id,
      logoPath: logo_path,
    })
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id)
  }
}
