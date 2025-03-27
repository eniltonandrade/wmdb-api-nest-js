import { Injectable, NotFoundException } from '@nestjs/common'
import { Person, Prisma } from '@prisma/client'
import { PrismaService } from 'src/database/prisma/prisma.service'

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

  async findAll(): Promise<Person[]> {
    return await this.prisma.person.findMany()
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
}
