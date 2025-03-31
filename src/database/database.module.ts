import { Logger, Module } from '@nestjs/common'
import { LogEvent, MysqlDialect } from 'kysely'
import { createPool } from 'mysql2'
import { KyselyModule } from 'nestjs-kysely'

import { EnvModule } from '@/env/env.module'
import { EnvService } from '@/env/env.service'

import {
  DrizzleAsyncProvider,
  drizzleProvider,
} from './drizzle/drizzle.provider'
import { PrismaService } from './prisma/prisma.service'

const logger = new Logger('DATABASE')

@Module({
  imports: [
    EnvModule, // Ensure EnvModule is imported
    KyselyModule.forRootAsync({
      imports: [EnvModule], // Import EnvModule to provide EnvService
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        log: (event: LogEvent) => {
          if (event.level === 'query') {
            logger.log(`SQL: ${event.query.sql}`)
            logger.debug(`Params: ${JSON.stringify(event.query.parameters)}`)
            logger.verbose(`Execution time: ${event.queryDurationMillis}ms`)
          } else if (event.level === 'error') {
            logger.error(`Error: ${event.error}`)
          }
        },
        dialect: new MysqlDialect({
          pool: createPool(env.get('DATABASE_URL')),
        }),
      }),
    }),
  ],
  providers: [...drizzleProvider, PrismaService], // No need to provide EnvService here
  exports: [DrizzleAsyncProvider, PrismaService],
})
export class DatabaseModule {}
