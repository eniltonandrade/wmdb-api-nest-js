type Rating = {
  source: string
  value: number
}

const MAX_SCORES: Record<string, number> = {
  IMDB: 10,
  METACRITIC: 100,
  ROTTEN_TOMATOES: 100,
  TMDB: 10,
  // You can add more sources here if needed
}

export function getAverageRating(ratings: Rating[]): number {
  if (ratings.length === 0) return 0

  const normalizedRatings = ratings.map(({ source, value }) => {
    const max = MAX_SCORES[source.toUpperCase()] || 10
    return (value / max) * 10
  })

  const total = normalizedRatings.reduce((sum, r) => sum + r, 0)
  const average = total / normalizedRatings.length

  return parseFloat(average.toFixed(1))
}
