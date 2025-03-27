import { ApiProperty } from '@nestjs/swagger'

export class ApiListResponseDto<T> {
  @ApiProperty({ example: 1 })
  total: number

  @ApiProperty({ isArray: true })
  results: T[]
}
