import { MysqlDialect } from 'kysely'
import { createPool } from 'mysql2'
import { KyselyModule } from 'nestjs-kysely'

import { EnvModule } from '@/env/env.module'
import { EnvService } from '@/env/env.service'

export const KyselyAsyncProvider = 'kyselyProvider'

export const kyselyProvider = [
  {
    provide: KyselyAsyncProvider,
    imports: [EnvModule],
    inject: [EnvService],
    useFactory: (env: EnvService) => {
      return new MysqlDialect({
        pool: createPool(env.get('DATABASE_URL')),
      })
    },
  },
  KyselyModule.forRootAsync({
    imports: [EnvModule],
    inject: [EnvService],
    useFactory: (env: EnvService) => ({
      dialect: new MysqlDialect({
        pool: createPool(env.get('DATABASE_URL')),
      }),
    }),
  }),
]
