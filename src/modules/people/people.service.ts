import { Injectable, NotFoundException } from '@nestjs/common'
import { Person, Prisma } from '@prisma/client'

import { PrismaService } from '@/database/prisma/prisma.service'
import { ApiListResponseDto } from '@/types/api-responses'

@Injectable()
export class PeopleService {
  constructor(private prisma: PrismaService) {}

  async findOrCreate(data: Prisma.PersonCreateInput): Promise<Person> {
    const person = await this.prisma.person.upsert({
      create: data,
      update: {},
      where: { tmdbId: data.tmdbId },
    })

    return person
  }

  async findAll(): Promise<ApiListResponseDto<Person>> {
    const [results, total] = await this.prisma.$transaction([
      this.prisma.person.findMany(),
      this.prisma.person.count(),
    ])
    return {
      total,
      results,
    }
  }

  async findOne(id: number): Promise<Person> {
    const person = await this.prisma.person.findUnique({
      where: { tmdbId: id },
    })

    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`)
    }

    return person
  }

  async update(id: string, data: Prisma.PersonUpdateInput) {
    const genreExists = await this.prisma.genre.findUnique({
      where: { id },
    })

    if (!genreExists) {
      throw new NotFoundException(`Genre with TMDB ID ${id} not found`)
    }

    await this.prisma.person.update({
      data: {
        name: data.name,
        tmdbId: data.tmdbId,
        gender: data.gender,
        profilePath: data.profilePath,
      },
      where: {
        id,
      },
    })
  }

  async remove(id: string) {
    await this.prisma.person.delete({
      where: {
        id,
      },
    })
  }

  async addPersonToMovie(
    person: Prisma.PersonCreateInput,
    data: Prisma.PersonOnMoviesUncheckedCreateWithoutPersonInput,
  ): Promise<void> {
    await this.prisma.person.upsert({
      where: {
        tmdbId: person.tmdbId,
      },
      update: {
        name: person.name,
        profilePath: person.profilePath,
        gender: person.gender,
        movies: {
          create: {
            ...data,
          },
        },
      },
      create: {
        name: person.name,
        profilePath: person.profilePath,
        gender: person.gender,
        tmdbId: person.tmdbId,
        movies: {
          create: {
            ...data,
          },
        },
      },
    })
  }
}
