import { Injectable, NotFoundException } from '@nestjs/common'
import { User } from '@prisma/client'
import { PrismaService } from 'src/database/prisma/prisma.service'

import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /*
        TODO: return other data from user
    */
  async getProfile(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  async get(userId: string): Promise<Partial<User>> {
    const user = await this.prisma.user.findUnique({
      select: {
        id: true,
        avatarUrl: true,
        name: true,
        username: true,
        preferredRating: true,
      },
      where: {
        id: userId,
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  async update(userId: string, data: UpdateUserDto) {
    await this.prisma.user.update({
      data,
      where: {
        id: userId,
      },
    })
  }
}
