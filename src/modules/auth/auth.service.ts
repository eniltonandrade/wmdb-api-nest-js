import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import * as argon2 from 'argon2'
import * as bcrypt from 'bcrypt'

import { PrismaService } from '@/database/prisma/prisma.service'
import { EnvService } from '@/env/env.service'

import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private env: EnvService,
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

    const { accessToken, refreshToken } = await this.generateTokens(
      userFromEmail.id,
    )

    await this.updateRefreshToken(userFromEmail.id, refreshToken)

    return { access_token: accessToken, refresh_token: refreshToken }
  }

  async refreshTokens(userId: string, payloadRefreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access Denied')
    console.log('payloadRefreshToken:', payloadRefreshToken)
    console.log('user.refreshToken:', user.refreshToken)
    const isMatch = await argon2.verify(user.refreshToken, payloadRefreshToken)
    console.log('isMatch', isMatch)
    if (!isMatch) throw new UnauthorizedException('Invalid refresh token')

    this.jwtService.verify(payloadRefreshToken, {
      secret: this.env.get('JWT_REFRESH_SECRET'),
    })

    const { accessToken, refreshToken } = await this.generateTokens(user.id)
    await this.updateRefreshToken(user.id, refreshToken)

    return { access_token: accessToken, refresh_token: refreshToken }
  }

  private async generateTokens(userId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
        },
        {
          secret: this.env.get('JWT_SECRET'),
          expiresIn: this.env.get('JWT_EXPIRES_IN'),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
        },
        {
          secret: this.env.get('JWT_REFRESH_SECRET'),
          expiresIn: this.env.get('JWT_REFRESH_EXPIRES_IN'),
        },
      ),
    ])

    return {
      accessToken,
      refreshToken,
    }
  }

  async signOut(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    })
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await argon2.hash(refreshToken)
    console.log('hashedToken:', hashedToken)
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    })
  }
}
