import { Body, Controller, Post, Put, UsePipes } from '@nestjs/common'
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe'

import { AuthService } from './auth.service'
import { CurrentUser } from './current-user.decorator'
import {
  authenticateWithPasswordBodySchema,
  AuthenticateWithPasswordDto,
} from './dto/authenticate-with-password.dto'
import { registerBodySchema, RegisterDto } from './dto/register.dto'
import {
  updatePasswordBodySchema,
  UpdatePasswordDto,
} from './dto/update-password.dto'
import { UserPayload } from './jwt.strategy'
import { Public } from './public'

@Controller('sessions')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @UsePipes(new ZodValidationPipe(registerBodySchema))
  register(@Body() body: RegisterDto) {
    const { email, password, name } = body
    return this.authService.register({
      email,
      name,
      password,
    })
  }

  @Public()
  @Post('password')
  @UsePipes(new ZodValidationPipe(authenticateWithPasswordBodySchema))
  authenticateWithPassword(@Body() body: AuthenticateWithPasswordDto) {
    const { email, password } = body
    return this.authService.authenticate(email, password)
  }

  @Put('update-password')
  updatePassword(
    @Body(new ZodValidationPipe(updatePasswordBodySchema))
    body: UpdatePasswordDto,
    @CurrentUser() user: UserPayload,
  ) {
    const { password } = body
    return this.authService.updatePassword(user.sub, password)
  }
}
