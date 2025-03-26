import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Genre } from '@prisma/client'
import { PrismaService } from 'src/database/prisma/prisma.service'

import { CreateGenreDto } from './dto/create-genre.dto'
import { UpdateGenreDto } from './dto/update-genre.dto'

@Injectable()
export class GenresService {
  constructor(private prisma: PrismaService) {}

  async create({ name, tmdb_id }: CreateGenreDto): Promise<Genre> {
    const genreAlreadyExists = await this.prisma.genre.findUnique({
      where: {
        tmdbId: tmdb_id,
      },
    })

    if (genreAlreadyExists) {
      throw new ConflictException(
        `Genre with TMDB ID ${tmdb_id} already exists`,
      )
    }

    const genre = await this.prisma.genre.create({
      data: {
        name,
        tmdbId: tmdb_id,
      },
    })

    return genre
  }

  async findAll(): Promise<Genre[]> {
    return await this.prisma.genre.findMany()
  }

  async findOne(id: string): Promise<Genre> {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
    })

    if (!genre) {
      throw new NotFoundException(`Genre ${id} not found`)
    }

    return genre
  }

  async update(id: string, { name, tmdb_id }: UpdateGenreDto): Promise<void> {
    const genreExists = await this.prisma.genre.findUnique({
      where: { id },
    })

    if (!genreExists) {
      throw new NotFoundException(`Genre with TMDB ID ${tmdb_id} not found`)
    }

    await this.prisma.genre.update({
      data: {
        name,
        tmdbId: tmdb_id,
      },
      where: {
        id,
      },
    })
  }

  async remove(id: string): Promise<void> {
    await this.prisma.genre.delete({
      where: {
        id,
      },
    })
  }
}
