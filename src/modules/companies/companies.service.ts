import { Injectable, NotFoundException } from '@nestjs/common'
import { Company, Prisma } from '@prisma/client'

import { PrismaService } from '@/database/prisma/prisma.service'
import { ApiListResponseDto } from '@/types/api-responses'

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findOrCreate({
    name,
    tmdbId,
  }: Prisma.CompanyCreateInput): Promise<Company> {
    const company = await this.prisma.company.upsert({
      create: {
        name,
        tmdbId,
      },
      update: {},
      where: { tmdbId },
    })

    return company
  }

  async findAll(): Promise<ApiListResponseDto<Company>> {
    const [results, total] = await this.prisma.$transaction([
      this.prisma.company.findMany(),
      this.prisma.company.count(),
    ])
    return {
      total,
      results,
    }
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    })

    if (!company) {
      throw new NotFoundException(`Company ${id} not found`)
    }

    return company
  }

  async update(
    id: string,
    { name, tmdbId }: Prisma.CompanyUpdateInput,
  ): Promise<void> {
    const companyExists = await this.prisma.company.findUnique({
      where: { id },
    })

    if (!companyExists) {
      throw new NotFoundException(`Company with TMDB ID ${tmdbId} not found`)
    }

    await this.prisma.company.update({
      data: {
        name,
        tmdbId,
      },
      where: {
        id,
      },
    })
  }

  async remove(id: string): Promise<void> {
    await this.prisma.company.delete({
      where: {
        id,
      },
    })
  }

  async addCompanyToMovie(
    company: Prisma.CompanyCreateInput,
    movieId: string,
  ): Promise<void> {
    const companyFoundOrCreated = await this.prisma.company.upsert({
      where: {
        tmdbId: company.tmdbId,
      },
      update: {},
      create: {
        name: company.name,
        tmdbId: company.tmdbId,
        logoPath: company.logoPath,
      },
    })

    const alreadyRelated = await this.prisma.companiesOnMovies.findUnique({
      where: {
        companyId_movieId: {
          companyId: companyFoundOrCreated.id,
          movieId,
        },
      },
    })

    if (!alreadyRelated) {
      await this.prisma.companiesOnMovies.create({
        data: {
          companyId: companyFoundOrCreated.id,
          movieId,
        },
      })
    }
  }
}
