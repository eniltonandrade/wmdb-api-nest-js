import { Injectable, NotFoundException } from '@nestjs/common'
import { Movie, Prisma } from '@prisma/client'

import { PrismaService } from '@/database/prisma/prisma.service'
import { ApiListResponseDto } from '@/types/api-responses'

import { CompaniesService } from '../companies/companies.service'
import { GenresService } from '../genres/genres.service'
import { PeopleService } from '../people/people.service'
import { CreateMovieRelationshipsDto } from './dto/create-movie-relationships.dto'
import { MovieRatingsDto } from './dto/update-movie-ratings.dto'

@Injectable()
export class MoviesService {
  constructor(
    private prisma: PrismaService,
    private readonly peopleService: PeopleService,
    private readonly companiesService: CompaniesService,
    private readonly genresService: GenresService,
  ) {}

  private async getMovieByTmdbId(tmdbId: number): Promise<Movie | null> {
    const movie = await this.prisma.movie.findUnique({
      where: { tmdbId },
    })

    return movie
  }

  async get(movieId: string): Promise<Movie> {
    const movie = await this.prisma.movie.findUnique({
      where: {
        id: movieId,
      },
    })

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`)
    }

    return movie
  }

  async getByTmdbId(movieId: number): Promise<Movie> {
    const movie = await this.prisma.movie.findUnique({
      where: { tmdbId: movieId },
    })

    if (!movie) {
      throw new NotFoundException(`Movie with TMDB ID ${movieId} not found`)
    }

    return movie
  }

  async findAll(): Promise<ApiListResponseDto<Movie>> {
    const [movies, count] = await this.prisma.$transaction([
      this.prisma.movie.findMany(),
      this.prisma.movie.count(),
    ])
    return {
      total: count,
      results: movies,
    }
  }

  async create(
    data: Prisma.MovieCreateInput,
  ): Promise<{ created: boolean; id: string }> {
    const movieAlreadyExists = await this.getMovieByTmdbId(data.tmdbId)

    if (movieAlreadyExists) {
      return {
        created: false,
        id: movieAlreadyExists.id,
      }
    }

    const movie = await this.prisma.movie.create({
      data: {
        ...data,
        releaseDate: new Date(data.releaseDate),
      },
    })

    return {
      created: true,
      id: movie?.id,
    }
  }

  async update(tmdbId: number, data: Prisma.MovieUpdateInput): Promise<void> {
    const movieExists = await this.getMovieByTmdbId(tmdbId)

    if (!movieExists) {
      throw new NotFoundException(`Movie with TMDB ID ${tmdbId} not found`)
    }

    await this.prisma.movie.update({
      data,
      where: {
        tmdbId,
      },
    })
  }

  async createMovieRelationships(
    movieId: string,
    data: CreateMovieRelationshipsDto,
  ) {
    const {
      casts: { cast, crew },
      production_companies,
      genres,
      ratings,
    } = data

    const groupedPromises: Promise<void | null>[] = []

    cast.forEach(async (cast) => {
      groupedPromises.push(
        this.peopleService.addPersonToMovie(
          {
            name: cast.name,
            tmdbId: cast.id,
            gender: cast.gender,
            profilePath: cast.profile_path,
          },
          {
            movieId,
            role: cast.gender === 1 ? 'ACTRESS' : 'ACTOR',
            character: cast.character,
            order: cast.order,
          },
        ),
      )
    })

    const onlyValidCrew = crew.filter(
      (c) => c.job === 'Director' || c.job === 'Screenplay',
    )

    onlyValidCrew.forEach(async (crew) => {
      await this.peopleService.addPersonToMovie(
        {
          name: crew.name,
          tmdbId: crew.id,
          gender: crew.gender,
          profilePath: crew.profile_path,
        },
        {
          movieId,
          role: crew.job === 'Director' ? 'DIRECTOR' : 'WRITER',
        },
      )
    })

    production_companies.forEach(async (company) => {
      groupedPromises.push(
        this.companiesService.addCompanyToMovie(
          {
            name: company.name,
            tmdbId: company.id,
            logoPath: company.logo_path,
          },
          movieId,
        ),
      )
    })

    genres.forEach(async (genre) => {
      groupedPromises.push(
        this.genresService.addGenreToMovie(
          {
            name: genre.name,
            tmdbId: genre.id,
          },
          movieId,
        ),
      )
    })

    ratings.forEach(async (item) => {
      await this.prisma.ratingsOnMovies.upsert({
        create: {
          ratingSource: item.source,
          value: item.value,
          movieId,
        },
        update: {},
        where: {
          ratingSource_movieId: {
            movieId,
            ratingSource: item.source,
          },
        },
      })
    })

    await Promise.all(groupedPromises)
  }

  async updateMovieRating(movieId: string, data: MovieRatingsDto[]) {
    data.forEach(async (item) => {
      await this.prisma.ratingsOnMovies.upsert({
        create: {
          ratingSource: item.source,
          value: item.value,
          movieId,
        },
        update: {
          ratingSource: item.source,
          value: item.value,
          movieId,
        },
        where: {
          ratingSource_movieId: {
            movieId,
            ratingSource: item.source,
          },
        },
      })
    })
  }
}
