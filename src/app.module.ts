import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'

import { LoggingMiddleware } from './common/logging/logging.middleware'
import { DatabaseModule } from './database/database.module'
import { envSchema } from './env/env'
import { EnvModule } from './env/env.module'
import { AuthModule } from './modules/auth/auth.module'
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard'
import { CompaniesModule } from './modules/companies/companies.module'
import { GenresModule } from './modules/genres/genres.module'
import { HistoriesModule } from './modules/histories/histories.module'
import { MoviesModule } from './modules/movies/movies.module'
import { PeopleModule } from './modules/people/people.module'
import { ReportsModule } from './modules/reports/reports.module'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    EnvModule,
    UsersModule,
    MoviesModule,
    GenresModule,
    PeopleModule,
    CompaniesModule,
    HistoriesModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*') // Apply to all routes
  }
}
