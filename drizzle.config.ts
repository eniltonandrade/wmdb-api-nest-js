import 'dotenv/config' // make sure to install dotenv package

import { Config, defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'mysql',
  out: './src/database/drizzle',
  schema: './src/database/drizzle/schema.ts',
  dbCredentials: {
    host: 'wmdb-dev.mysql.uhserver.com',
    port: 3306,
    user: 'wmdb_test',
    password: 'fK@mj8uTVc-myvGc',
    database: 'wmdb_test',
  },
  // Print all statements
  verbose: true,
  // Always ask for confirmation
  strict: true,
} as Config)
