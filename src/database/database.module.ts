import { Logger, Module } from '@nestjs/common'
import { CamelCasePlugin, LogEvent, PostgresDialect } from 'kysely'
import { KyselyModule } from 'nestjs-kysely'
import { Pool, types } from 'pg'

import { EnvModule } from '@/env/env.module'
import { EnvService } from '@/env/env.service'

import { PrismaService } from './prisma/prisma.service'

const logger = new Logger('DATABASE')
types.setTypeParser(types.builtins.INT8, (val) => Number(val))
types.setTypeParser(types.builtins.INT4, (val) => Number(val))

@Module({
  imports: [
    EnvModule, // Ensure EnvModule is imported
    KyselyModule.forRootAsync({
      imports: [EnvModule], // Import EnvModule to provide EnvService
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        log: (event: LogEvent) => {
          if (event.level === 'query') {
            logger.debug(`SQL: ${event.query.sql}`)
            logger.debug(`Params: ${JSON.stringify(event.query.parameters)}`)
            logger.verbose(`Execution time: ${event.queryDurationMillis}ms`)
          } else if (event.level === 'error') {
            logger.error(`Error: ${event.error}`)
          }
        },
        dialect: new PostgresDialect({
          pool: new Pool({
            database: env.get('DATABASE_NAME'),
            host: env.get('DATABASE_HOST'),
            user: env.get('DATABASE_USER'),
            password: env.get('DATABASE_PASSWORD'),
            port: 5432,
            max: 10,
            ssl: env.get('DATABASE_SSL'),
          }),
        }),
        plugins: [new CamelCasePlugin()],
      }),
    }),
  ],
  providers: [PrismaService], // No need to provide EnvService here
  exports: [PrismaService],
})
export class DatabaseModule {}
