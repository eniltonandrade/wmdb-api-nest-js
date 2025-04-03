import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  UsePipes,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { ZodValidationPipe } from '@/pipes/zod-validation.pipe'

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
import { RefreshPayload } from './jwt-refresh.strategy'
import { JwtRefreshAuthGuard } from './jwt-refresh-auth.guard'
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
  @ApiBearerAuth()
  updatePassword(
    @Body(new ZodValidationPipe(updatePasswordBodySchema))
    body: UpdatePasswordDto,
    @CurrentUser() user: UserPayload,
  ) {
    const { password } = body
    return this.authService.updatePassword(user.sub, password)
  }

  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @Get('refresh')
  refreshTokens(@CurrentUser() user: RefreshPayload) {
    const refreshToken = user.refreshToken
    return this.authService.refreshTokens(user.sub, refreshToken)
  }

  @Post('signout')
  logout(@CurrentUser() user: RefreshPayload) {
    return this.authService.signOut(user.sub)
  }
}
