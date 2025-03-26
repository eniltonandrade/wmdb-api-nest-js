import { Module } from '@nestjs/common'
import { EnvService } from 'src/env/env.service'

import {
  DrizzleAsyncProvider,
  drizzleProvider,
} from './drizzle/drizzle.provider'

@Module({
  imports: [],
  providers: [...drizzleProvider, EnvService],
  exports: [DrizzleAsyncProvider],
})
export class DatabaseModule {}
