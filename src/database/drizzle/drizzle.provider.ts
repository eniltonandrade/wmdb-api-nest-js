import { drizzle } from 'drizzle-orm/mysql2'
import * as mysql from 'mysql2/promise'
import { EnvModule } from 'src/env/env.module'
import { EnvService } from 'src/env/env.service'

import * as schema from './schema'
export const DrizzleAsyncProvider = 'drizzleProvider'

export const drizzleProvider = [
  {
    provide: DrizzleAsyncProvider,
    inject: [EnvService],
    imports: [EnvModule],
    useFactory: (env: EnvService) => {
      const connection = mysql.createPool(env.get('DATABASE_URL'))
      const db = drizzle(connection, { schema, mode: 'planetscale' })
      return db
    },
    exports: [DrizzleAsyncProvider],
  },
]
