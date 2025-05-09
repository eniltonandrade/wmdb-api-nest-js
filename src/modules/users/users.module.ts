import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'

import { DatabaseModule } from '@/database/database.module'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    UsersService,
  ],
  controllers: [UsersController],
})
export class UsersModule {}
