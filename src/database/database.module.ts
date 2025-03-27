import { Module } from '@nestjs/common'

import { EnvService } from '@/env/env.service'

import {
  DrizzleAsyncProvider,
  drizzleProvider,
} from './drizzle/drizzle.provider'
import { PrismaService } from './prisma/prisma.service'

@Module({
  imports: [],
  providers: [...drizzleProvider, EnvService, PrismaService],
  exports: [DrizzleAsyncProvider, PrismaService],
})
export class DatabaseModule {}
