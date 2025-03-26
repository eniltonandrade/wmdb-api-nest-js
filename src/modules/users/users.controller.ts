import { Body, Controller, Get, Put } from '@nestjs/common'
import { CurrentUser } from 'src/modules/auth/current-user.decorator'
import { UserPayload } from 'src/modules/auth/jwt.strategy'
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe'

import { updateUserBodySchema, UpdateUserDto } from './dto/update-user.dto'
import { UsersService } from './users.service'

@Controller('user')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  get(@CurrentUser() user: UserPayload) {
    return this.userService.get(user.sub)
  }

  @Put()
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
