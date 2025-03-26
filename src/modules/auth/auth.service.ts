import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { DrizzleAsyncProvider } from 'src/database/drizzle/drizzle.provider'
import * as schema from 'src/database/drizzle/schema'

import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
    private jwtService: JwtService,
  ) {}

  async register({ name, email, password }: RegisterDto) {
    const userWithSameEmail = await this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    })

    if (userWithSameEmail) {
      throw new ConflictException()
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = this.db
      .insert(schema.users)
      .values({
        email,
        name,
        passwordHash: hashedPassword,
      })
      .$returningId()
    return newUser
  }

  async updatePassword(id: string, password: string) {
    const userExists = await this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
    })
    if (!userExists) {
      throw new ConflictException()
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await this.db
      .update(schema.users)
      .set({
        passwordHash: hashedPassword,
      })
      .where(eq(schema.users.id, id))
  }

  async authenticate(email: string, password: string) {
    const userFromEmail = await this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    })

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
