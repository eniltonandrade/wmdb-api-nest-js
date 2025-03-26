import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { DrizzleAsyncProvider } from 'src/database/drizzle/drizzle.provider'
import * as schema from 'src/database/drizzle/schema'

import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

  /*
        TODO: return other data from user
    */
  async getProfile(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  async get(userId: string) {
    const user = await this.db.query.users.findFirst({
      columns: {
        id: true,
        avatarUrl: true,
        name: true,
        username: true,
        preferredRating: true,
      },
      where: eq(schema.users.id, userId),
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  async update(userId: string, data: UpdateUserDto) {
    await this.db
      .update(schema.users)
      .set(data)
      .where(eq(schema.users.id, userId))
  }
}
