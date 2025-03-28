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
  ): Promise<void | null> {
    const personFoundOrCreated = await this.prisma.person.upsert({
      where: {
        tmdbId: person.tmdbId,
      },
      update: {},
      create: {
        name: person.name,
        profilePath: person.profilePath,
        gender: person.gender,
        tmdbId: person.tmdbId,
      },
    })

    const sameRoleExists = await this.prisma.personOnMovies.findUnique({
      where: {
        personId_movieId_role: {
          personId: personFoundOrCreated.id,
          movieId: data.movieId,
          role: data.role,
        },
      },
    })

    if (!sameRoleExists) {
      await this.prisma.personOnMovies.create({
        data: {
          role: data.role,
          character: data.character,
          order: data.order,
          movieId: data.movieId,
          personId: personFoundOrCreated.id,
        },
      })
    }
  }
}
