import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'

import { CurrentUser } from '../auth/current-user.decorator'
import { UserPayload } from '../auth/jwt.strategy'
import { CreateHistoryDto } from './dto/create-history.dto'
import { queryStringDto, queryStringSchema } from './dto/query-histories.dto'
import { UpdateHistoryDto } from './dto/update-history.dto'
import { HistoriesService } from './histories.service'
import { UserHistoriesService } from './user-histories.service'

@Controller('histories')
export class HistoriesController {
  constructor(
    private readonly historiesService: HistoriesService,
    private readonly userHistoriesService: UserHistoriesService,
  ) {}

  @Post()
  @ApiBearerAuth()
  async create(
    @Body() body: CreateHistoryDto,
    @CurrentUser() user: UserPayload,
  ) {
    const { date, movieId, rating, review } = body

    return await this.historiesService.create({
      date,
      movieId,
      userId: user.sub,
      rating,
      review,
    })
  }

  @Get()
  findAll() {
    return this.historiesService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.historiesService.findOne(+id)
  }

  @Get('/users/:userId')
  fetchUserHistory(
    @Param('userId') userId: string,
    @Query(new ZodValidationPipe(queryStringSchema)) query: queryStringDto,
  ) {
    return this.userHistoriesService.fetchUserHistory(userId, query)
  }

  @Patch(':id')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() body: UpdateHistoryDto) {
    const { date, rating, review } = body
    return this.historiesService.update(id, {
      date,
      rating,
      review,
    })
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.historiesService.remove(id)
  }
}
