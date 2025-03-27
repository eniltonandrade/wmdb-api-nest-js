import { Module } from '@nestjs/common'
import { DatabaseModule } from '@/database/database.module'

import { GenresController } from './genres.controller'
import { GenresService } from './genres.service'

@Module({
  imports: [DatabaseModule],
  controllers: [GenresController],
  providers: [GenresService],
})
export class GenresModule {}
