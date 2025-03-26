import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { DrizzleAsyncProvider } from 'src/database/drizzle/drizzle.provider'
import * as schema from 'src/database/drizzle/schema'

import { CreateMovieDTO } from './dto/create-movie-dto'
import { UpdateMovieDto } from './dto/update-movie-dto'

@Injectable()
export class MoviesService {
  constructor(
    @Inject(DrizzleAsyncProvider) private db: MySql2Database<typeof schema>,
  ) {}

  async get(movieId: string) {
    const movie = await this.db.query.movies.findFirst({
      where: eq(schema.movies.id, movieId),
    })

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`)
    }

    return movie
  }

  async getByTmdbId(movieId: number) {
    const movie = await this.db.query.movies.findFirst({
      where: eq(schema.movies.tmdbId, movieId),
    })

    if (!movie) {
      throw new NotFoundException(`Movie with TMDB ID ${movieId} not found`)
    }

    return movie
  }

  async create({
    backdrop_path,
    imdb_id,
    original_title,
    poster_path,
    release_date,
    runtime,
    title,
    tmdb_id,
  }: CreateMovieDTO) {
    const movieAlreadyExists = await this.db.query.movies.findFirst({
      where: eq(schema.movies.tmdbId, tmdb_id),
    })

    if (movieAlreadyExists) {
      return {
        created: false,
        id: movieAlreadyExists.id,
      }
    }

    await this.db
      .insert(schema.movies)
      .values({
        imdbId: imdb_id,
        originalTitle: original_title,
        releaseDate: release_date,
        title,
        tmdbId: tmdb_id,
        backdropPath: backdrop_path,
        posterPath: poster_path,
        runtime,
      })
      .$returningId()

    const movie = await this.db.query.movies.findFirst({
      where: eq(schema.movies.tmdbId, tmdb_id),
    })

    return {
      created: true,
      id: movie?.id,
    }
  }

  async update(
    id: string,
    {
      backdrop_path,
      imdb_id,
      original_title,
      poster_path,
      release_date,
      runtime,
      title,
      tmdb_id,
      imdb_rating,
      metacritic_rating,
      rotten_tomatoes_rating,
      tmdb_rating,
    }: UpdateMovieDto,
  ) {
    const movieExists = await this.db.query.movies.findFirst({
      where: eq(schema.movies.id, id),
    })

    if (!movieExists) {
      throw new NotFoundException(`Movie with TMDB ID ${tmdb_id} not found`)
    }

    await this.db
      .update(schema.movies)
      .set({
        backdropPath: backdrop_path,
        imdbId: imdb_id,
        originalTitle: original_title,
        posterPath: poster_path,
        releaseDate: release_date,
        runtime,
        title,
        tmdbId: tmdb_id,
        imdbRating: imdb_rating,
        metacriticRating: metacritic_rating,
        rottenTomatoesRating: rotten_tomatoes_rating,
        tmdbRating: tmdb_rating,
      })
      .where(eq(schema.movies.id, id))
  }

  async addGenreToMovie(movieId: string, genreId: string) {
    await this.db.insert(schema.movieGenres).values({
      movieId,
      genreId,
    })
  }
}
