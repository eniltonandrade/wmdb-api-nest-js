import { getAverageRating } from './get-average-ratings'

describe('getAverageRating', () => {
  it('calculates the correct average with mixed rating sources', () => {
    const ratings = [
      { ratingSource: 'IMDB', value: 6 },
      { ratingSource: 'METACRITIC', value: 31 },
      { ratingSource: 'ROTTEN_TOMATOES', value: 16 },
      { ratingSource: 'TMDB', value: 6.6 },
    ]

    const average = getAverageRating(ratings)

    expect(average).toBeCloseTo(4.3, 1) // within 1 decimal place
  })

  it('returns 0 for empty array', () => {
    expect(getAverageRating([])).toBe(0)
  })

  it('defaults to max 10 if ratingSource is unknown', () => {
    const ratings = [
      { ratingSource: 'UNKNOWN_SOURCE', value: 5 }, // assumes max 10
    ]

    expect(getAverageRating(ratings)).toBe(5)
  })

  it('handles all 100-scale ratings', () => {
    const ratings = [
      { ratingSource: 'METACRITIC', value: 80 },
      { ratingSource: 'ROTTEN_TOMATOES', value: 90 },
    ]

    const average = getAverageRating(ratings) // 8.0 and 9.0 => avg = 8.5

    expect(average).toBe(8.5)
  })
})
