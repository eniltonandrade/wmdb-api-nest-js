import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { PrismaService } from 'src/database/prisma/prisma.service'

import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async getUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    })
  }

  private async getUserById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException()
    }

    return user
  }

  async register({ name, email, password }: RegisterDto): Promise<User> {
    const userWithSameEmail = await this.getUserByEmail(email)

    if (userWithSameEmail) {
      throw new ConflictException()
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
      },
    })

    return newUser
  }

  async updatePassword(id: string, password: string): Promise<void> {
    const userExists = await this.getUserById(id)
    if (!userExists) {
      throw new ConflictException()
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await this.prisma.user.update({
      data: {
        passwordHash: hashedPassword,
      },
      where: {
        id,
      },
    })
  }

  async authenticate(email: string, password: string) {
    const userFromEmail = await this.getUserByEmail(email)

    if (!userFromEmail) {
      throw new UnauthorizedException('Invalid credentials')
    }

    if (userFromEmail.passwordHash === null) {
      throw new UnauthorizedException('User with no password')
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      userFromEmail.passwordHash,
    )

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const token = this.jwtService.sign({ sub: userFromEmail.id })

    return { access_token: token }
  }
}
