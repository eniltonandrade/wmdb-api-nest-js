export const PAGE_SIZE = 20
type MovieColumns = Partial<Record<string, string>>
export const MOVIE_FILTER_COLUMNS: MovieColumns = {
  release_date: 'releaseDate',
  rating_imdb: 'IMDB',
  rating_tmdb: 'TMDB',
  rating_rotten: 'ROTTEN_TOMATOES',
  rating_metacritic: 'METACRITIC',
}

export const MOVIE_COLUMNS_MAP: MovieColumns = {
  imdb_rating: 'IMDB',
  tmdb_rating: 'TMDB',
  rotten_tomatoes_rating: 'ROTTEN_TOMATOES',
  metacritic_rating: 'METACRITIC',
}

export const DEFAULT_TAGS = [
  {
    name: 'Cinema',
    colorHex: '#B11226',
  },
  {
    name: 'Netflix',
    colorHex: '#E50914',
  },
  {
    name: 'Prime Video',
    colorHex: '#00A8E1',
  },
  {
    name: 'Stremio',
    colorHex: '#664181',
  },
]
