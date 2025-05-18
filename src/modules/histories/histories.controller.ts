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
import { CreateHistoryDto, createHistorySchema } from './dto/create-history.dto'
import {
  ManageHistoryTagsDto,
  manageHistoryTagsSchema,
} from './dto/manage-history-tags.dto'
import { queryStringDto, queryStringSchema } from './dto/query-histories.dto'
import { UpdateHistoryDto } from './dto/update-history.dto'
import { HistoriesService } from './histories.service'
import { UserHistoriesService } from './user-histories.service'

@Controller('me/history')
@ApiBearerAuth()
export class HistoriesController {
  constructor(
    private readonly historiesService: HistoriesService,
    private readonly userHistoriesService: UserHistoriesService,
  ) {}

  @Post('/movies')
  async create(
    @Body(new ZodValidationPipe(createHistorySchema)) body: CreateHistoryDto,
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

  @Get('/movies/:movieId')
  async findOne(
    @CurrentUser() user: UserPayload,
    @Param('movieId') movieId: string,
  ) {
    return await this.historiesService.findOneByUserAndMovie(user.sub, movieId)
  }

  @Get('/movies')
  fetchUserHistory(
    @CurrentUser() user: UserPayload,
    @Query(new ZodValidationPipe(queryStringSchema)) query: queryStringDto,
  ) {
    return this.userHistoriesService.fetchUserHistory(user.sub, query)
  }

  @Get('/tmdb-ids')
  async getTmdbIds(@CurrentUser() user: UserPayload) {
    return this.historiesService.getTmdbIdsFromHistories(user.sub)
  }

  @Patch(':id')
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

  @Post('/:id/tags')
  async manageHistoryTags(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(manageHistoryTagsSchema))
    body: ManageHistoryTagsDto,
    @CurrentUser() user: UserPayload,
  ) {
    const { tagIds } = body

    return await this.historiesService.manageHistoryTags(user.sub, id, tagIds)
  }
}
