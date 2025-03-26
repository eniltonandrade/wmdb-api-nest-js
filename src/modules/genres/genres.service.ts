import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { DrizzleAsyncProvider } from 'src/database/drizzle/drizzle.provider'
import * as schema from 'src/database/drizzle/schema'

import { CreateGenreDto } from './dto/create-genre.dto'
import { UpdateGenreDto } from './dto/update-genre.dto'

@Injectable()
export class GenresService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

  async create({ name, tmdb_id }: CreateGenreDto) {
    const genreAlreadyExists = await this.db.query.genres.findFirst({
      where: eq(schema.genres.tmdbId, tmdb_id),
    })

    if (genreAlreadyExists) {
      throw new ConflictException(
        `Genre with TMDB ID ${tmdb_id} already exists`,
      )
    }

    await this.db.insert(schema.genres).values({
      name,
      tmdbId: tmdb_id,
    })
  }

  async findAll() {
    return await this.db.query.genres.findMany()
  }

  async findOne(id: string) {
    return await this.db.query.genres.findFirst({
      where: eq(schema.genres.id, id),
    })
  }

  async update(id: string, { name, tmdb_id }: UpdateGenreDto) {
    const genreExists = await this.db.query.genres.findFirst({
      where: eq(schema.genres.id, id),
    })

    if (!genreExists) {
      throw new NotFoundException(`Genre with TMDB ID ${tmdb_id} not found`)
    }

    await this.db
      .update(schema.genres)
      .set({
        name,
        tmdbId: tmdb_id,
      })
      .where(eq(schema.genres.id, id))
  }

  async remove(id: string) {
    return await this.db.delete(schema.genres).where(eq(schema.genres.id, id))
  }
}
