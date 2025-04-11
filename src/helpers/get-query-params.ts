import { $Enums, RatingSource } from '@prisma/client'
import { OrderByDirectionExpression } from 'kysely'

import { PAGE_SIZE } from '@/common/constants/app.constants'

export async function getQueryParams(
  page: number,
  sort_by: string,
  selected_rating:
    | 'IMDB'
    | 'TMDB'
    | 'ROTTEN_TOMATOES'
    | 'METACRITIC'
    | null
    | undefined,
  user: {
    preferredRating: $Enums.RatingSource | null
  } | null,
): Promise<{
  averageBy: 'movies.average_rating' | 'movie_ratings.value'
  column: string
  ratingSource: RatingSource
  skip: number
  sortOrder: OrderByDirectionExpression
  take: number
}> {
  const { skip, take } = {
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  }

  const [column, direction] = sort_by.split('.')

  const sortOrder: OrderByDirectionExpression =
    direction as OrderByDirectionExpression

  const selectedRatingSource = selected_rating || 'AVERAGE'

  const averageBy =
    selectedRatingSource === 'AVERAGE'
      ? 'movies.average_rating'
      : 'movie_ratings.value'

  const ratingSource =
    selectedRatingSource === 'AVERAGE'
      ? (user?.preferredRating as RatingSource)
      : selectedRatingSource

  return {
    skip,
    take,
    column,
    sortOrder,
    averageBy,
    ratingSource,
  }
}
