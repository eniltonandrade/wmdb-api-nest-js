import { Body, Controller, Get, Put } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@/modules/auth/current-user.decorator'
import { UserPayload } from '@/modules/auth/jwt.strategy'
import { ZodValidationPipe } from '@/pipes/zod-validation.pipe'

import { updateUserBodySchema, UpdateUserDto } from './dto/update-user.dto'
import { UsersService } from './users.service'

@Controller('me')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @ApiBearerAuth()
  @Get('/profile')
  get(@CurrentUser() user: UserPayload) {
    return this.userService.get(user.sub)
  }

  @Put()
  @ApiBearerAuth()
  update(
    @Body(new ZodValidationPipe(updateUserBodySchema))
    body: UpdateUserDto,
    @CurrentUser() user: UserPayload,
  ) {
    const { avatarUrl, email, name, username } = body
    return this.userService.update(user.sub, {
      avatarUrl,
      email,
      name,
      username,
    })
  }
}
