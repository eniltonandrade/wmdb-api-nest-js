import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { ZodValidationPipe } from '@/pipes/zod-validation.pipe'

import { CurrentUser } from '../auth/current-user.decorator'
import { UserPayload } from '../auth/jwt.strategy'
import { CreateTagDto, createTagSchema } from './dto/create-tag.dto'
import { UpdateTagDto } from './dto/update-tag.dto'
import { TagsService } from './tags.service'

@ApiBearerAuth()
@Controller('me/tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createTagSchema)) body: CreateTagDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.tagsService.create({
      colorHex: body.color_hex,
      name: body.name,
      userId: user.sub,
    })
  }

  @Get()
  findAll(@CurrentUser() user: UserPayload) {
    return this.tagsService.findAll(user.sub)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() body: UpdateTagDto,
  ) {
    return this.tagsService.update(user.sub, id, {
      colorHex: body.color_hex,
      name: body.name,
    })
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.tagsService.remove(user.sub, id)
  }
}
