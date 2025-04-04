import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
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
    try {
      const {
        casts: { cast, crew },
        production_companies,
        genres,
        ratings,
      } = data

      const groupedPromises: Promise<void | null>[] = []

      // await Promise.all(
      //   cast.map((cast) =>
      //     this.peopleService.addPersonToMovie(
      //       {
      //         name: cast.name,
      //         tmdbId: cast.id,
      //         gender: cast.gender,
      //         profilePath: cast.profile_path,
      //       },
      //       {
      //         movieId,
      //         role: cast.gender === 1 ? 'ACTRESS' : 'ACTOR',
      //         character: cast.character,
      //         order: cast.order,
      //       },
      //     ),
      //   ),
      // )

      for await (const item of cast) {
        await this.peopleService.addPersonToMovie(
          {
            name: item.name,
            tmdbId: item.id,
            gender: item.gender,
            profilePath: item.profile_path,
          },
          {
            movieId,
            role: item.gender === 1 ? 'ACTRESS' : 'ACTOR',
            character: item.character,
            order: item.order,
          },
        )
      }

      const onlyValidCrew = crew.filter(
        (c) => c.job === 'Director' || c.job === 'Screenplay',
      )

      await Promise.all(
        onlyValidCrew.map((crew) =>
          this.peopleService.addPersonToMovie(
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
          ),
        ),
      )

      for (const company of production_companies) {
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
      }

      for (const genre of genres) {
        groupedPromises.push(
          this.genresService.addGenreToMovie(
            {
              name: genre.name,
              tmdbId: genre.id,
            },
            movieId,
          ),
        )
      }

      await Promise.all(
        ratings.map((item) =>
          this.prisma.ratingsOnMovies.upsert({
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
          }),
        ),
      )

      await Promise.all(groupedPromises)
    } catch (error) {
      throw new InternalServerErrorException()
    }
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
